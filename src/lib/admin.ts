import { supabase } from "@/integrations/supabase/client";
import {
  PRODUCT_IMAGE_BUCKET,
  deriveProductStatus,
  hasSupabaseEnv,
  mapOrderRow,
  mapProfileRow,
  slugifyProductName,
  type AdminProfile,
  type OrderRecord,
  type ProductImage,
  type StoreProduct,
} from "@/lib/catalog";

export type ProductEditorValues = {
  name: string;
  price: number;
  description: string;
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  category: string;
  isActive: boolean;
  isSoldOut: boolean;
};

export type AdminSessionState = {
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];
  profile: AdminProfile;
};

type SaveProductArgs = {
  values: ProductEditorValues;
  currentProduct?: StoreProduct | null;
  existingImages: ProductImage[];
  removedImages: ProductImage[];
  newFiles: File[];
};

function ensureSupabaseConfigured() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured yet. Add your environment variables first.");
  }
}

async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfileRow(data) : null;
}

export async function getCurrentAdminSession(): Promise<AdminSessionState | null> {
  ensureSupabaseConfigured();

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const session = data.session;
  if (!session) return null;

  const profile = await getProfile(session.user.id);
  if (!profile) return null;

  return {
    session,
    profile,
  };
}

export async function signInAdmin(email: string, password: string) {
  ensureSupabaseConfigured();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchAdminProducts() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, image_url, storage_path, sort_order)")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
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
  })) as StoreProduct[];
}

export async function fetchOrders() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, status, total_amount, items, shipping_address, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map(mapOrderRow) as OrderRecord[];
}

async function uploadProductImages(productId: string, name: string, files: File[]) {
  const uploaded: Array<{ image_url: string; storage_path: string }> = [];

  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${productId}/${Date.now()}-${slugifyProductName(name)}-${index}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(storagePath);
    uploaded.push({
      image_url: data.publicUrl,
      storage_path: storagePath,
    });
  }

  return uploaded;
}

export async function saveProduct({
  values,
  currentProduct,
  existingImages,
  removedImages,
  newFiles,
}: SaveProductArgs) {
  ensureSupabaseConfigured();

  const payload = {
    name: values.name.trim(),
    slug: slugifyProductName(values.name),
    description: values.description.trim(),
    price: values.price,
    sizes: values.sizes,
    colors: values.colors,
    stock_quantity: values.stockQuantity,
    category: values.category.trim(),
    is_active: values.isActive,
    status: deriveProductStatus(values.isActive, values.isSoldOut),
  };

  const existingProductId = currentProduct?.id;
  let productId = existingProductId;

  if (existingProductId) {
    const { error } = await supabase.from("products").update(payload).eq("id", existingProductId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) throw error;
    productId = data.id;
  }

  if (!productId) throw new Error("Unable to save the product.");

  if (removedImages.length > 0) {
    const storagePaths = removedImages
      .map((image) => image.storagePath)
      .filter((value): value is string => Boolean(value));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(storagePaths);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));

    if (deleteError) throw deleteError;
  }

  const keptImages = existingImages.filter(
    (image) => !removedImages.some((removedImage) => removedImage.id === image.id),
  );

  for (const [index, image] of keptImages.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", image.id);

    if (error) throw error;
  }

  if (newFiles.length > 0) {
    const uploadedImages = await uploadProductImages(productId, values.name, newFiles);
    const { error } = await supabase.from("product_images").insert(
      uploadedImages.map((image, index) => ({
        product_id: productId,
        image_url: image.image_url,
        storage_path: image.storage_path,
        sort_order: keptImages.length + index,
      })),
    );

    if (error) throw error;
  }
}

export async function deleteProduct(product: StoreProduct) {
  ensureSupabaseConfigured();

  const storagePaths = product.images
    .map((image) => image.storagePath)
    .filter((value): value is string => Boolean(value));

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;
}
