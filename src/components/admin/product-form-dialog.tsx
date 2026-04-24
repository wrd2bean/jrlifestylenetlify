import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, Video } from "lucide-react";
import { saveProduct, type ProductEditorValues } from "@/lib/admin";
import {
  SIZE_OPTIONS,
  getProductBadge,
  parseCommaSeparated,
  serializeCommaSeparated,
  type ProductImage,
  type ProductVideo,
  type StoreProduct,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: StoreProduct | null;
  onSaved: () => Promise<void> | void;
};

type PreviewFile = {
  file: File;
  previewUrl: string;
};

function createInitialValues(product?: StoreProduct | null): ProductEditorValues {
  return {
    name: product?.name ?? "",
    price: product?.price ?? 40,
    description: product?.description ?? "",
    sizes: product?.sizes ?? ["M", "L", "XL"],
    colors: product?.colors ?? ["Black"],
    stockQuantity: product?.stockQuantity ?? 0,
    category: product?.category ?? "T-Shirts",
    isActive: product?.isActive ?? true,
    isSoldOut: product?.status === "sold_out",
    isPreorder: product?.isPreorder ?? false,
    featuredHomepage: product?.featuredHomepage ?? false,
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const [values, setValues] = useState<ProductEditorValues>(createInitialValues(product));
  const [colorsInput, setColorsInput] = useState(serializeCommaSeparated(product?.colors ?? ["Black"]));
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [removedImages, setRemovedImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<PreviewFile[]>([]);
  const [existingVideos, setExistingVideos] = useState<ProductVideo[]>(product?.videos ?? []);
  const [removedVideos, setRemovedVideos] = useState<ProductVideo[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<PreviewFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(createInitialValues(product));
    setColorsInput(serializeCommaSeparated(product?.colors ?? ["Black"]));
    setExistingImages(product?.images ?? []);
    setRemovedImages([]);
    setNewFiles([]);
    setExistingVideos(product?.videos ?? []);
    setRemovedVideos([]);
    setNewVideoFiles([]);
    setErrorMessage(null);
  }, [open, product]);

  useEffect(() => {
    return () => {
      for (const file of [...newFiles, ...newVideoFiles]) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, [newFiles, newVideoFiles]);

  function toggleSize(size: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      sizes: checked ? [...current.sizes, size] : current.sizes.filter((entry) => entry !== size),
    }));
  }

  function handleExistingImageRemove(image: ProductImage) {
    setExistingImages((current) => current.filter((entry) => entry.id !== image.id));
    setRemovedImages((current) => [...current, image]);
  }

  function handleExistingVideoRemove(video: ProductVideo) {
    setExistingVideos((current) => current.filter((entry) => entry.id !== video.id));
    setRemovedVideos((current) => [...current, video]);
  }

  function handleNewFileRemove(targetFile: PreviewFile, type: "image" | "video") {
    URL.revokeObjectURL(targetFile.previewUrl);

    if (type === "image") {
      setNewFiles((current) => current.filter((entry) => entry.previewUrl !== targetFile.previewUrl));
      return;
    }

    setNewVideoFiles((current) => current.filter((entry) => entry.previewUrl !== targetFile.previewUrl));
  }

  function handleFileChange(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;

    const previews = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (type === "image") {
      setNewFiles((current) => [...current, ...previews]);
      return;
    }

    setNewVideoFiles((current) => [...current, ...previews]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveProduct({
        values: {
          ...values,
          colors: parseCommaSeparated(colorsInput),
        },
        currentProduct: product,
        existingImages,
        removedImages,
        newFiles: newFiles.map((entry) => entry.file),
        existingVideos,
        removedVideos,
        newVideoFiles: newVideoFiles.map((entry) => entry.file),
      });

      for (const file of [...newFiles, ...newVideoFiles]) {
        URL.revokeObjectURL(file.previewUrl);
      }

      onOpenChange(false);
      await onSaved();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setIsSaving(false);
    }
  }

  const previewBadge = getProductBadge({
    id: product?.id ?? "preview",
    name: values.name,
    slug: product?.slug ?? "preview",
    description: values.description,
    price: values.price,
    category: values.category,
    sizes: values.sizes,
    colors: parseCommaSeparated(colorsInput),
    stockQuantity: values.stockQuantity,
    isActive: values.isActive,
    isPreorder: values.isPreorder,
    featuredHomepage: values.featuredHomepage,
    status: !values.isActive ? "draft" : values.isSoldOut ? "sold_out" : "active",
    createdAt: product?.createdAt ?? new Date().toISOString(),
    updatedAt: product?.updatedAt ?? new Date().toISOString(),
    images: existingImages,
    videos: existingVideos,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-border bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase tracking-[0.08em]">
            {product ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription>
            Upload images and videos, set preorder and featured homepage rules, and publish products without touching code.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                placeholder="Born To Win Tee"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={values.category}
                onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
                placeholder="T-Shirts"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={values.price}
                onChange={(event) => setValues((current) => ({ ...current, price: Number(event.target.value || 0) }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={values.stockQuantity}
                onChange={(event) =>
                  setValues((current) => ({ ...current, stockQuantity: Number(event.target.value || 0) }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              placeholder="Premium streetwear description..."
              className="min-h-28"
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="colors">Colors</Label>
              <Input
                id="colors"
                value={colorsInput}
                onChange={(event) => setColorsInput(event.target.value)}
                placeholder="Black, Cream, Red"
              />
              <p className="text-xs text-muted-foreground">Separate colors with commas.</p>
            </div>

            <div className="space-y-3">
              <Label>Sizes</Label>
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 sm:grid-cols-4">
                {SIZE_OPTIONS.map((size) => (
                  <label key={size} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={values.sizes.includes(size)}
                      onCheckedChange={(checked) => toggleSize(size, checked === true)}
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <ToggleCard
              title="Visible on site"
              description="Turn off to hide the product."
              checked={values.isActive}
              onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: checked }))}
            />
            <ToggleCard
              title="Mark sold out"
              description="Keep it visible but unavailable."
              checked={values.isSoldOut}
              onCheckedChange={(checked) => setValues((current) => ({ ...current, isSoldOut: checked }))}
            />
            <ToggleCard
              title="Enable preorder"
              description="Let customers buy before inventory lands."
              checked={values.isPreorder}
              onCheckedChange={(checked) => setValues((current) => ({ ...current, isPreorder: checked }))}
            />
            <ToggleCard
              title="Featured Homepage Product"
              description="Use this tee in the homepage hero."
              checked={values.featuredHomepage}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, featuredHomepage: checked }))
              }
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Storefront badge</p>
            <p className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-bone">
              {previewBadge ?? "Live"}
            </p>
          </div>

          <MediaUploader
            id="images"
            title="Product images"
            icon={<ImagePlus className="h-5 w-5 text-blood" />}
            description="PNG, JPG, or WEBP. Front, back, details, lifestyle."
            accept="image/*"
            existingItems={existingImages}
            newItems={newFiles}
            onExistingRemove={(item) => handleExistingImageRemove(item as ProductImage)}
            onNewRemove={(item) => handleNewFileRemove(item, "image")}
            onFilesChange={(files) => handleFileChange(files, "image")}
            renderExisting={(item) => <img src={(item as ProductImage).imageUrl} alt="" className="aspect-square w-full object-cover" />}
            renderNew={(item) => <img src={item.previewUrl} alt="" className="aspect-square w-full object-cover" />}
          />

          <MediaUploader
            id="videos"
            title="Product videos"
            icon={<Video className="h-5 w-5 text-blood" />}
            description="MP4 or MOV. These autoplay, loop, and stay muted on the product page."
            accept="video/*"
            existingItems={existingVideos}
            newItems={newVideoFiles}
            onExistingRemove={(item) => handleExistingVideoRemove(item as ProductVideo)}
            onNewRemove={(item) => handleNewFileRemove(item, "video")}
            onFilesChange={(files) => handleFileChange(files, "video")}
            renderExisting={(item) => (
              <video
                src={(item as ProductVideo).videoUrl}
                className="aspect-square w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            renderNew={(item) => (
              <video
                src={item.previewUrl}
                className="aspect-square w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
          />

          {errorMessage && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2 bg-blood text-white hover:bg-blood/90" disabled={isSaving}>
              {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function MediaUploader({
  id,
  title,
  icon,
  description,
  accept,
  existingItems,
  newItems,
  onExistingRemove,
  onNewRemove,
  onFilesChange,
  renderExisting,
  renderNew,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  description: string;
  accept: string;
  existingItems: unknown[];
  newItems: PreviewFile[];
  onExistingRemove: (item: unknown) => void;
  onNewRemove: (item: PreviewFile) => void;
  onFilesChange: (files: FileList | null) => void;
  renderExisting: (item: unknown) => ReactNode;
  renderNew: (item: PreviewFile) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{title}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-center gap-3 rounded-3xl border border-dashed border-border/70 bg-background/30 px-5 py-10 text-center transition-colors hover:border-blood/60 hover:bg-background/50"
      >
        {icon}
        <div>
          <p className="text-sm font-medium">Upload {title.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </label>
      <Input id={id} type="file" multiple accept={accept} className="hidden" onChange={(event) => onFilesChange(event.target.files)} />

      {(existingItems.length > 0 || newItems.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {existingItems.map((item, index) => (
            <div key={`existing-${index}`} className="overflow-hidden rounded-3xl border border-border/70 bg-background/40">
              {renderExisting(item)}
              <button
                type="button"
                onClick={() => onExistingRemove(item)}
                className="flex w-full items-center justify-center gap-2 border-t border-border/70 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}

          {newItems.map((item) => (
            <div key={item.previewUrl} className="overflow-hidden rounded-3xl border border-border/70 bg-background/40">
              {renderNew(item)}
              <button
                type="button"
                onClick={() => onNewRemove(item)}
                className="flex w-full items-center justify-center gap-2 border-t border-border/70 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
