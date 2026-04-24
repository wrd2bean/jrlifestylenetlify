import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { legacyProducts } from "@/lib/products";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export type AdminRole = "admin" | "employee";
export type ProductStatus = "active" | "sold_out" | "draft";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export type ProductImage = {
  id: string;
  imageUrl: string;
  storagePath: string | null;
  sortOrder: number;
};

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
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
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
  totalAmount: number;
  items: Json;
  shippingAddress: Json | null;
  createdAt: string;
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
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: Array<{
    id: string;
    image_url: string;
    storage_path: string | null;
    sort_order: number;
  }>;
};

const PUBLIC_STATUSES: ProductStatus[] = ["active", "sold_out"];

export function hasSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
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

export function getSecondaryImage(product: StoreProduct) {
  return product.images[1]?.imageUrl ?? product.images[0]?.imageUrl ?? "";
}

export function getProductBadge(product: StoreProduct) {
  if (product.status === "sold_out" || product.stockQuantity <= 0) return "Sold Out";
  if (!product.isActive) return "Draft";
  if (product.stockQuantity <= 10) return "Low Stock";
  return undefined;
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
    status: deriveProductStatus(product.isActive, product.isSoldOut),
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
    images: product.images.map((imageUrl, imageIndex) => ({
      id: `${product.slug}-${imageIndex}`,
      imageUrl,
      storagePath: null,
      sortOrder: imageIndex,
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
  };
}

export async function fetchStoreProducts(options?: { includeInactive?: boolean }) {
  if (!hasSupabaseEnv()) return mapLegacyProducts();

  let query = supabase
    .from("products")
    .select("*, product_images(id, image_url, storage_path, sort_order)")
    .order("updated_at", { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true).in("status", PUBLIC_STATUSES);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as ProductRow[] | null) ?? []).map(mapProductRow);
}

export async function fetchStoreProductBySlug(slug: string, options?: { includeInactive?: boolean }) {
  const products = await fetchStoreProducts(options);
  return products.find((product) => product.slug === slug) ?? null;
}

export function mapOrderRow(row: {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount: number | string;
  items: Json;
  shipping_address: Json | null;
  created_at: string;
}): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    totalAmount: Number(row.total_amount),
    items: row.items,
    shippingAddress: row.shipping_address,
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
