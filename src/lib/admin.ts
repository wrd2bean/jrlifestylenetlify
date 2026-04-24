import { supabase } from "@/integrations/supabase/client";
import {
  PRODUCT_IMAGE_BUCKET,
  PRODUCT_VIDEO_BUCKET,
  deriveProductStatus,
  defaultStoreSettings,
  hasSupabaseEnv,
  mapOrderRow,
  mapProfileRow,
  slugifyProductName,
  type AdminProfile,
  type OrderRecord,
  type OrderStatus,
  type ProductImage,
  type ProductVideo,
  type StoreSettings,
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
  isPreorder: boolean;
  featuredHomepage: boolean;
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
  existingVideos: ProductVideo[];
  removedVideos: ProductVideo[];
  newVideoFiles: File[];
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

function mapAdminProductRow(row: any): StoreProduct {
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

export async function fetchAdminProducts() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_images(id, image_url, storage_path, sort_order), product_videos(id, video_url, storage_path, sort_order)",
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map(mapAdminProductRow) as StoreProduct[];
}

export async function fetchOrders() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, status, payment_status, preorder, total_amount, items, shipping_address, stripe_checkout_session_id, stripe_payment_intent_id, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as any[]).map(mapOrderRow) as OrderRecord[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  ensureSupabaseConfigured();

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export async function fetchAdminStoreSettings() {
  ensureSupabaseConfigured();

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

export async function saveStoreSettings(settings: StoreSettings) {
  ensureSupabaseConfigured();

  const { error } = await supabase.from("store_settings").upsert({
    id: "default",
    shipping_flat_rate: settings.shippingFlatRate,
    free_shipping_threshold: settings.freeShippingThreshold,
    estimated_tax_rate: settings.estimatedTaxRate,
    delivery_notes: settings.deliveryNotes,
    enable_automatic_tax: settings.enableAutomaticTax,
    allow_promotion_codes: settings.allowPromotionCodes,
  });

  if (error) throw error;
}

async function uploadFiles(
  bucket: string,
  productId: string,
  name: string,
  folder: string,
  files: File[],
) {
  const uploaded: Array<{ urlField: string; url: string; storagePath: string }> = [];

  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop() ?? "bin";
    const storagePath = `${productId}/${folder}-${Date.now()}-${slugifyProductName(name)}-${index}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    uploaded.push({
      urlField: bucket === PRODUCT_VIDEO_BUCKET ? "video_url" : "image_url",
      url: data.publicUrl,
      storagePath,
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
  existingVideos,
  removedVideos,
  newVideoFiles,
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
    is_preorder: values.isPreorder,
    featured_homepage: values.featuredHomepage,
    status: deriveProductStatus(values.isActive, values.isSoldOut),
  };

  const existingProductId = currentProduct?.id;
  let productId = existingProductId;

  if (values.featuredHomepage) {
    const { error: unfeatureError } = await supabase
      .from("products")
      .update({ featured_homepage: false })
      .eq("featured_homepage", true);

    if (unfeatureError) throw unfeatureError;
  }

  if (existingProductId) {
    const { error } = await supabase.from("products").update(payload).eq("id", existingProductId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;
    productId = data.id;
  }

  if (!productId) throw new Error("Unable to save the product.");

  if (removedImages.length > 0) {
    const storagePaths = removedImages
      .map((image) => image.storagePath)
      .filter((value): value is string => Boolean(value));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .remove(storagePaths);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));

    if (deleteError) throw deleteError;
  }

  if (removedVideos.length > 0) {
    const storagePaths = removedVideos
      .map((video) => video.storagePath)
      .filter((value): value is string => Boolean(value));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(PRODUCT_VIDEO_BUCKET)
        .remove(storagePaths);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("product_videos")
      .delete()
      .in("id", removedVideos.map((video) => video.id));

    if (deleteError) throw deleteError;
  }

  const keptImages = existingImages.filter(
    (image) => !removedImages.some((removedImage) => removedImage.id === image.id),
  );
  const keptVideos = existingVideos.filter(
    (video) => !removedVideos.some((removedVideo) => removedVideo.id === video.id),
  );

  for (const [index, image] of keptImages.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", image.id);

    if (error) throw error;
  }

  for (const [index, video] of keptVideos.entries()) {
    const { error } = await supabase
      .from("product_videos")
      .update({ sort_order: index })
      .eq("id", video.id);

    if (error) throw error;
  }

  if (newFiles.length > 0) {
    const uploadedImages = await uploadFiles(
      PRODUCT_IMAGE_BUCKET,
      productId,
      values.name,
      "image",
      newFiles,
    );

    const { error } = await supabase.from("product_images").insert(
      uploadedImages.map((image, index) => ({
        product_id: productId,
        image_url: image.url,
        storage_path: image.storagePath,
        sort_order: keptImages.length + index,
      })),
    );

    if (error) throw error;
  }

  if (newVideoFiles.length > 0) {
    const uploadedVideos = await uploadFiles(
      PRODUCT_VIDEO_BUCKET,
      productId,
      values.name,
      "video",
      newVideoFiles,
    );

    const { error } = await supabase.from("product_videos").insert(
      uploadedVideos.map((video, index) => ({
        product_id: productId,
        video_url: video.url,
        storage_path: video.storagePath,
        sort_order: keptVideos.length + index,
      })),
    );

    if (error) throw error;
  }
}

export async function deleteProduct(product: StoreProduct) {
  ensureSupabaseConfigured();

  const imageStoragePaths = product.images
    .map((image) => image.storagePath)
    .filter((value): value is string => Boolean(value));
  const videoStoragePaths = product.videos
    .map((video) => video.storagePath)
    .filter((value): value is string => Boolean(value));

  if (imageStoragePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove(imageStoragePaths);
    if (storageError) throw storageError;
  }

  if (videoStoragePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_VIDEO_BUCKET)
      .remove(videoStoragePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;
}
