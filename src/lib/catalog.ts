import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { legacyProducts } from "@/lib/products";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const PRODUCT_VIDEO_BUCKET = "product-videos";
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export type AdminRole = "admin" | "employee";
export type ProductStatus = "active" | "sold_out" | "draft";
export type OrderStatus = "paid" | "processing" | "shipped" | "delivered" | "canceled";

export type ProductImage = {
  id: string;
  imageUrl: string;
  storagePath: string | null;
  sortOrder: number;
};

export type ProductVideo = {
  id: string;
  videoUrl: string;
  storagePath: string | null;
  sortOrder: number;
};

export type ProductMedia =
  | { id: string; type: "image"; url: string; sortOrder: number }
  | { id: string; type: "video"; url: string; sortOrder: number };

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  isActive: boolean;
  isPreorder: boolean;
  featuredHomepage: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  videos: ProductVideo[];
};

export type AdminProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AdminRole;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: string;
  preorder: boolean;
  totalAmount: number;
  items: Json;
  shippingAddress: Json | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
};

export type StoreSettings = {
  id: string;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  estimatedTaxRate: number;
  deliveryNotes: string;
  enableAutomaticTax: boolean;
  allowPromotionCodes: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  category: string;
  sizes: string[];
  colors: string[];
  stock_quantity: number;
  is_active: boolean;
  is_preorder: boolean;
  featured_homepage: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: Array<{
    id: string;
    image_url: string;
    storage_path: string | null;
    sort_order: number;
  }>;
  product_videos?: Array<{
    id: string;
    video_url: string;
    storage_path: string | null;
    sort_order: number;
  }>;
};

const PUBLIC_STATUSES: ProductStatus[] = ["active", "sold_out"];

export function hasSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  return Boolean(url && key);
}

export function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseCommaSeparated(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function serializeCommaSeparated(values: string[]) {
  return values.join(", ");
}

export function getPrimaryImage(product: StoreProduct) {
  return product.images[0]?.imageUrl ?? "";
}

export function getPrimaryVideo(product: StoreProduct) {
  return product.videos[0]?.videoUrl ?? "";
}

export function getSecondaryImage(product: StoreProduct) {
  return product.images[1]?.imageUrl ?? product.images[0]?.imageUrl ?? "";
}

export function getProductMedia(product: StoreProduct): ProductMedia[] {
  const images = product.images.map((image) => ({
    id: image.id,
    type: "image" as const,
    url: image.imageUrl,
    sortOrder: image.sortOrder + 1000,
  }));
  const videos = product.videos.map((video) => ({
    id: video.id,
    type: "video" as const,
    url: video.videoUrl,
    sortOrder: video.sortOrder,
  }));

  return [...videos, ...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFeaturedHomepageProduct(products: StoreProduct[]) {
  return products.find((product) => product.featuredHomepage) ?? products[0] ?? null;
}

export function getProductBadge(product: StoreProduct) {
  if (product.isPreorder) return "Preorder";
  if (product.status === "sold_out" || product.stockQuantity <= 0) return "Sold Out";
  if (!product.isActive) return "Draft";
  if (product.stockQuantity <= 10) return "Low Stock";
  return undefined;
}

export function getPurchaseButtonLabel(product: StoreProduct) {
  if (product.isPreorder) return "Preorder Now";
  if (product.status === "sold_out" || product.stockQuantity <= 0) return "Sold Out";
  return "Add To Cart";
}

export function canPurchaseProduct(product: StoreProduct) {
  if (!product.isActive || product.status === "draft") return false;
  if (product.isPreorder) return true;
  return product.status !== "sold_out" && product.stockQuantity > 0;
}

export function defaultStoreSettings(): StoreSettings {
  return {
    id: "default",
    shippingFlatRate: 8,
    freeShippingThreshold: 100,
    estimatedTaxRate: 0,
    deliveryNotes: "Orders typically ship within 3-5 business days unless marked as preorder.",
    enableAutomaticTax: true,
    allowPromotionCodes: true,
  };
}

export function getShippingEstimate(subtotal: number, settings: StoreSettings) {
  if (
    settings.freeShippingThreshold !== null &&
    subtotal >= settings.freeShippingThreshold
  ) {
    return 0;
  }

  return settings.shippingFlatRate;
}

export function getEstimatedTaxes(subtotal: number, settings: StoreSettings) {
  return subtotal * (settings.estimatedTaxRate / 100);
}

export function getShortDescription(product: StoreProduct) {
  return product.description.length > 92
    ? `${product.description.slice(0, 89).trim()}...`
    : product.description;
}

export function deriveProductStatus(isActive: boolean, isSoldOut: boolean): ProductStatus {
  if (!isActive) return "draft";
  if (isSoldOut) return "sold_out";
  return "active";
}

function mapLegacyProducts(): StoreProduct[] {
  return legacyProducts.map((product, index) => ({
    id: product.slug,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    category: product.category,
    sizes: product.sizes,
    colors: product.colors,
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    isPreorder: product.isPreorder,
    featuredHomepage: product.featuredHomepage,
    status: deriveProductStatus(product.isActive, product.isSoldOut),
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
    images: product.images.map((imageUrl, imageIndex) => ({
      id: `${product.slug}-image-${imageIndex}`,
      imageUrl,
      storagePath: null,
      sortOrder: imageIndex,
    })),
    videos: product.videos.map((videoUrl, videoIndex) => ({
      id: `${product.slug}-video-${videoIndex}`,
      videoUrl,
      storagePath: null,
      sortOrder: videoIndex,
    })),
  }));
}

function mapProductRow(row: ProductRow): StoreProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    isPreorder: row.is_preorder,
    featuredHomepage: row.featured_homepage,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        imageUrl: image.image_url,
        storagePath: image.storage_path,
        sortOrder: image.sort_order,
      })),
    videos: [...(row.product_videos ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((video) => ({
        id: video.id,
        videoUrl: video.video_url,
        storagePath: video.storage_path,
        sortOrder: video.sort_order,
      })),
  };
}

export async function fetchStoreProducts(options?: { includeInactive?: boolean }) {
  if (!hasSupabaseEnv()) return mapLegacyProducts();

  let query = supabase
    .from("products")
    .select(
      "*, product_images(id, image_url, storage_path, sort_order), product_videos(id, video_url, storage_path, sort_order)",
    )
    .order("updated_at", { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true).in("status", PUBLIC_STATUSES);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as ProductRow[] | null) ?? []).map(mapProductRow);
}

export async function fetchStoreProductBySlug(
  slug: string,
  options?: { includeInactive?: boolean },
) {
  const products = await fetchStoreProducts(options);
  return products.find((product) => product.slug === slug) ?? null;
}

export async function fetchHomepageFeaturedProduct() {
  const products = await fetchStoreProducts();
  return getFeaturedHomepageProduct(products);
}

export async function fetchStoreSettings() {
  if (!hasSupabaseEnv()) return defaultStoreSettings();

  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "id, shipping_flat_rate, free_shipping_threshold, estimated_tax_rate, delivery_notes, enable_automatic_tax, allow_promotion_codes",
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data) return defaultStoreSettings();

  return {
    id: data.id,
    shippingFlatRate: Number(data.shipping_flat_rate),
    freeShippingThreshold:
      data.free_shipping_threshold === null ? null : Number(data.free_shipping_threshold),
    estimatedTaxRate: Number(data.estimated_tax_rate),
    deliveryNotes: data.delivery_notes,
    enableAutomaticTax: data.enable_automatic_tax,
    allowPromotionCodes: data.allow_promotion_codes,
  } satisfies StoreSettings;
}

export function mapOrderRow(row: {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  payment_status: string;
  preorder: boolean;
  total_amount: number | string;
  items: Json;
  shipping_address: Json | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    paymentStatus: row.payment_status,
    preorder: row.preorder,
    totalAmount: Number(row.total_amount),
    items: row.items,
    shippingAddress: row.shipping_address,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
  };
}

export function mapProfileRow(row: {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole;
  created_at: string;
}): AdminProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}
