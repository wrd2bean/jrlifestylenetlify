import Stripe from "stripe";
import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { defaultStoreSettings } from "@/lib/catalog";

const cartItemSchema = z.object({
  productId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().min(1).max(10),
  selectedSize: z.string().min(1),
  selectedColor: z.string().min(1),
});

const checkoutInputSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  checkoutToken: z.string().min(1),
});

const finalizeInputSchema = z.object({
  sessionId: z.string().min(1),
});

type CheckoutProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  is_active: boolean;
  is_preorder: boolean;
  status: "active" | "sold_out" | "draft";
  product_images?: Array<{ image_url: string }>;
};

type PendingOrderRow = {
  id: string;
  order_number: string;
  stripe_checkout_session_id: string | null;
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  });
}

function getBaseUrl() {
  const request = getRequest();
  const explicit =
    process.env.SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    process.env.VITE_SITE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

function createOrderNumber() {
  return `JR-${Date.now().toString().slice(-8)}`;
}

function createCheckoutFingerprint(checkoutToken: string, items: Json) {
  return createHash("sha256")
    .update(JSON.stringify({ checkoutToken, items }))
    .digest("hex");
}

function parsePaymentIntentId(value: string | Stripe.PaymentIntent | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function serializeShippingAddress(
  customerDetails: Stripe.Checkout.Session.CustomerDetails | null,
): Json | null {
  if (!customerDetails?.address) return null;

  return {
    name: customerDetails.name,
    email: customerDetails.email,
    phone: customerDetails.phone,
    address: {
      city: customerDetails.address.city,
      country: customerDetails.address.country,
      line1: customerDetails.address.line1,
      line2: customerDetails.address.line2,
      postal_code: customerDetails.address.postal_code,
      state: customerDetails.address.state,
    },
  };
}

async function fetchCheckoutSettings() {
  const { data } = await supabaseAdmin
    .from("store_settings")
    .select(
      "shipping_flat_rate, free_shipping_threshold, delivery_notes, enable_automatic_tax, allow_promotion_codes",
    )
    .eq("id", "default")
    .maybeSingle();

  if (!data) return defaultStoreSettings();

  return {
    ...defaultStoreSettings(),
    shippingFlatRate: Number(data.shipping_flat_rate),
    freeShippingThreshold:
      data.free_shipping_threshold === null ? null : Number(data.free_shipping_threshold),
    deliveryNotes: data.delivery_notes,
    enableAutomaticTax: data.enable_automatic_tax,
    allowPromotionCodes: data.allow_promotion_codes,
  };
}

async function sendOrderConfirmationEmail({
  orderNumber,
  customerName,
  customerEmail,
  items,
  totalAmount,
}: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Json;
  totalAmount: number;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_FROM_EMAIL;

  if (!resendApiKey || !fromEmail || !customerEmail) return;

  const lineItems = Array.isArray(items)
    ? items
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const typedItem = item as Record<string, Json>;
          return `${typedItem.quantity}x ${typedItem.name} (${typedItem.selectedSize}/${typedItem.selectedColor})`;
        })
        .filter(Boolean)
        .join("<br />")
    : "";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: customerEmail,
      subject: `JR Lifestyle Order Confirmation ${orderNumber}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #f6f2e8; background: #111; padding: 32px;">
          <p style="letter-spacing: 0.25em; text-transform: uppercase; color: #b22222; font-size: 12px;">JR Lifestyle</p>
          <h1 style="font-size: 32px; margin: 12px 0;">Order Confirmed</h1>
          <p>Thanks ${customerName || "for your order"}.</p>
          <p>Order number: <strong>${orderNumber}</strong></p>
          <p>Total paid: <strong>$${totalAmount.toFixed(2)}</strong></p>
          <div style="margin-top: 24px;">
            ${lineItems}
          </div>
        </div>
      `,
    }),
  });
}

function createShippingOption({
  amount,
  displayName,
  includeDeliveryEstimate,
}: {
  amount: number;
  displayName: string;
  includeDeliveryEstimate: boolean;
}): Stripe.Checkout.SessionCreateParams.ShippingOption {
  return {
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: {
        amount,
        currency: "usd",
      },
      display_name: displayName,
      ...(includeDeliveryEstimate
        ? {
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          }
        : {}),
    },
  };
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(checkoutInputSchema)
  .handler(async ({ data }) => {
    const stripe = getStripeClient();
    const settings = await fetchCheckoutSettings();
    const productIds = [...new Set(data.items.map((item) => item.productId))];

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, is_active, is_preorder, status, product_images(image_url)")
      .in("id", productIds);

    if (error) throw new Error(error.message);

    const productMap = new Map(
      ((products ?? []) as CheckoutProduct[]).map((product) => [product.id, product]),
    );

    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product || !product.is_active || product.status === "draft") {
        throw new Error("One of the items in your cart is no longer available.");
      }

      if (product.status === "sold_out" && !product.is_preorder) {
        throw new Error(`"${product.name}" is sold out.`);
      }

      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        unitPrice: Number(product.price),
        preorder: product.is_preorder,
        imageUrl: product.product_images?.[0]?.image_url ?? "",
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const preorder = orderItems.some((item) => item.preorder);
    const hasInStockItems = orderItems.some((item) => !item.preorder);
    const checkoutFingerprint = createCheckoutFingerprint(data.checkoutToken, orderItems as Json);

    const { data: existingPendingOrder, error: pendingOrderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, stripe_checkout_session_id")
      .eq("checkout_fingerprint", checkoutFingerprint)
      .eq("payment_status", "pending")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingOrderError) throw new Error(pendingOrderError.message);

    const reusableOrder = existingPendingOrder as PendingOrderRow | null;
    let orderId = reusableOrder?.id ?? "";
    let orderNumber = reusableOrder?.order_number ?? createOrderNumber();

    if (reusableOrder?.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          reusableOrder.stripe_checkout_session_id,
        );

        if (existingSession.status === "open" && existingSession.payment_status !== "paid" && existingSession.url) {
          return {
            url: existingSession.url,
            orderId: reusableOrder.id,
          };
        }
      } catch {
        // If the old session can't be reused, create a new one below.
      }
    }

    if (!orderId) {
      const { data: orderInsert, error: orderInsertError } = await supabaseAdmin
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: "",
          customer_email: "",
          total_amount: totalAmount,
          items: orderItems as Json,
          status: "draft",
          payment_status: "pending",
          preorder,
          checkout_fingerprint: checkoutFingerprint,
        })
        .select("id")
        .single();

      if (orderInsertError) throw new Error(orderInsertError.message);
      orderId = orderInsert.id;
    } else {
      const { error: refreshPendingError } = await supabaseAdmin
        .from("orders")
        .update({
          total_amount: totalAmount,
          items: orderItems as Json,
          preorder,
          payment_status: "pending",
          status: "draft",
          stripe_payment_intent_id: null,
        })
        .eq("id", orderId);

      if (refreshPendingError) throw new Error(refreshPendingError.message);
    }

    const baseUrl = getBaseUrl();
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];
    const includeDeliveryEstimate = !preorder;
    const freeShippingLabel = preorder
      ? hasInStockItems
        ? "Shipping Included — preorder items ship later"
        : "Preorder Shipping Included — ships after release"
      : "Free Shipping";
    const paidShippingLabel = preorder
      ? hasInStockItems
        ? "Mixed Cart Shipping — some items ship later"
        : "Preorder Shipping — ships after release"
      : settings.freeShippingThreshold
        ? `Flat Rate Shipping (free over $${settings.freeShippingThreshold})`
        : "Flat Rate Shipping";

    if (
      settings.freeShippingThreshold !== null &&
      totalAmount >= settings.freeShippingThreshold
    ) {
      shippingOptions.push(
        createShippingOption({
          amount: 0,
          displayName: freeShippingLabel,
          includeDeliveryEstimate,
        }),
      );
    }

    shippingOptions.push(
      createShippingOption({
        amount: Math.round(settings.shippingFlatRate * 100),
        displayName: paidShippingLabel,
        includeDeliveryEstimate,
      }),
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      billing_address_collection: "required",
      customer_creation: "always",
      allow_promotion_codes: settings.allowPromotionCodes,
      automatic_tax: {
        enabled: settings.enableAutomaticTax,
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: shippingOptions,
      metadata: {
        orderId,
        orderNumber,
        deliveryNotes: settings.deliveryNotes,
        checkoutFingerprint,
      },
      line_items: orderItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: {
            name: item.preorder ? `${item.name} (Preorder)` : item.name,
            images: item.imageUrl ? [item.imageUrl] : [],
            metadata: {
              productId: item.productId,
              size: item.selectedSize,
              color: item.selectedColor,
            },
          },
        },
      })),
    });

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: parsePaymentIntentId(session.payment_intent),
      })
      .eq("id", orderId);

    if (updateError) throw new Error(updateError.message);

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a redirect URL.");
    }

    return {
      url: session.url,
      orderId,
    };
  });

export const finalizeCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(finalizeInputSchema)
  .handler(async ({ data }) => {
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["payment_intent", "customer_details"],
    });

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new Error("Stripe session is missing an order reference.");
    }

    const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (existingOrderError) throw new Error(existingOrderError.message);
    if (!existingOrder) {
      throw new Error("Order not found for this checkout session.");
    }

    if (existingOrder.payment_status === "paid") {
      return {
        orderNumber: existingOrder.order_number,
        status: existingOrder.status,
      };
    }

    const isPaid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    const paymentStatus = isPaid ? "paid" : "pending";
    const orderStatus = isPaid ? "paid" : "draft";
    const customerDetails = session.customer_details;
    const shippingAddress = serializeShippingAddress(customerDetails);

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        customer_name: customerDetails?.name ?? existingOrder.customer_name ?? "",
        customer_email: customerDetails?.email ?? existingOrder.customer_email ?? "",
        shipping_address: shippingAddress,
        payment_status: paymentStatus,
        status: orderStatus,
        stripe_payment_intent_id: parsePaymentIntentId(session.payment_intent),
        stripe_checkout_session_id: session.id,
        total_amount:
          typeof session.amount_total === "number"
            ? session.amount_total / 100
            : Number(existingOrder.total_amount),
      })
      .eq("id", orderId);

    if (updateError) throw new Error(updateError.message);

    if (isPaid) {
      await sendOrderConfirmationEmail({
        orderNumber: existingOrder.order_number,
        customerName: customerDetails?.name ?? existingOrder.customer_name ?? "",
        customerEmail: customerDetails?.email ?? existingOrder.customer_email ?? "",
        items: existingOrder.items,
        totalAmount:
          typeof session.amount_total === "number"
            ? session.amount_total / 100
            : Number(existingOrder.total_amount),
      });
    }

    return {
      orderNumber: existingOrder.order_number,
      status: orderStatus,
    };
  });
