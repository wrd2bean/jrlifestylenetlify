import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCheckoutSession } from "@/lib/checkout";
import { useCart } from "@/lib/cart";
import {
  fetchStoreSettings,
  formatMoney,
  getEstimatedTaxes,
  getShippingEstimate,
  type StoreSettings,
} from "@/lib/catalog";

export const Route = createFileRoute("/cart")({
  loader: async () => ({
    settings: await fetchStoreSettings(),
  }),
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Cart — JR Lifestyle" },
      { name: "description", content: "Review your JR Lifestyle bag and continue to secure checkout." },
    ],
  }),
});

function CartPage() {
  const navigate = useNavigate();
  const { settings }: { settings: StoreSettings } = Route.useLoaderData();
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasPreorderItems = items.some((item) => item.isPreorder);
  const hasInStockItems = items.some((item) => !item.isPreorder);
  const estimatedTaxes = getEstimatedTaxes(subtotal, settings);
  const shippingEstimate = getShippingEstimate(subtotal, settings);
  const estimatedTotal = subtotal + estimatedTaxes + shippingEstimate;
  const shippingLabel = hasPreorderItems ? "Shipping" : "Shipping Estimate";
  const shippingMessage = hasPreorderItems
    ? hasInStockItems
      ? "Your order includes preorder items. Some items may ship later."
      : "Preorder items ship after release. Estimated shipping applies after the preorder is ready."
    : settings.deliveryNotes;

  async function handleCheckout() {
    setIsCheckingOut(true);
    setErrorMessage(null);

    try {
      const result = await createCheckoutSession({
        data: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
        },
      });

      window.location.href = result.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Shopping Cart</p>
          <h1 className="mt-2 font-display text-6xl uppercase tracking-wider md:text-8xl">Your Bag</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <Card className="border-border/70 bg-card/80">
                <CardContent className="space-y-6 p-10 text-center">
                  <p className="text-muted-foreground">Your bag is empty.</p>
                  <Button onClick={() => navigate({ to: "/shop" })} className="bg-bone text-background hover:bg-foreground">
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <Card key={item.id} className="border-border/70 bg-card/80">
                  <CardContent className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
                    <img src={item.imageUrl} alt={item.name} className="aspect-square w-full object-cover" />
                    <div className="flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-display text-2xl uppercase tracking-[0.08em]">{item.name}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Size {item.selectedSize} · Color {item.selectedColor}
                          </p>
                          {item.isPreorder && (
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-blood">
                              Preorder
                            </p>
                          )}
                        </div>
                        <p className="font-display text-xl text-bone">{formatMoney(item.price)}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center border border-border/70">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-4 py-3 text-foreground"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-4 py-3 text-foreground"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className="h-fit border-border/70 bg-card/80">
            <CardContent className="space-y-4 p-6">
              <p className="font-display text-3xl uppercase tracking-[0.08em]">Summary</p>
              <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
              <SummaryRow label="Estimated Taxes" value={formatMoney(estimatedTaxes)} />
              <SummaryRow label={shippingLabel} value={formatMoney(shippingEstimate)} />
              <p className="text-xs text-muted-foreground">
                {shippingMessage}
              </p>
              <div className="border-t border-border/70 pt-4">
                <SummaryRow label="Estimated Total" value={formatMoney(estimatedTotal)} emphasis />
              </div>
              {errorMessage && (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
              <Button
                onClick={handleCheckout}
                disabled={items.length === 0 || isCheckingOut}
                className="w-full bg-blood text-white hover:bg-blood/90"
              >
                {isCheckingOut && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Checkout With Stripe
              </Button>
              <Link to="/shop" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Continue shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? "font-display text-xl text-foreground" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}
