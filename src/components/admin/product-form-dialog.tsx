import { type FormEvent, useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { saveProduct, type ProductEditorValues } from "@/lib/admin";
import {
  SIZE_OPTIONS,
  getProductBadge,
  parseCommaSeparated,
  serializeCommaSeparated,
  type ProductImage,
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
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setValues(createInitialValues(product));
    setColorsInput(serializeCommaSeparated(product?.colors ?? ["Black"]));
    setExistingImages(product?.images ?? []);
    setRemovedImages([]);
    setNewFiles([]);
    setErrorMessage(null);
  }, [open, product]);

  useEffect(() => {
    return () => {
      for (const file of newFiles) {
        URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, [newFiles]);

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

  function handleNewFileRemove(targetFile: PreviewFile) {
    URL.revokeObjectURL(targetFile.previewUrl);
    setNewFiles((current) => current.filter((entry) => entry.previewUrl !== targetFile.previewUrl));
  }

  function handleFileChange(files: FileList | null) {
    if (!files || files.length === 0) return;

    const previews = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewFiles((current) => [...current, ...previews]);
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
      });

      for (const file of newFiles) {
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
    status: !values.isActive ? "draft" : values.isSoldOut ? "sold_out" : "active",
    createdAt: product?.createdAt ?? new Date().toISOString(),
    updatedAt: product?.updatedAt ?? new Date().toISOString(),
    images: existingImages,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-border bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase tracking-[0.08em]">
            {product ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription>
            Upload images, set inventory, and publish products without touching code.
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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Visible on site</p>
                  <p className="text-xs text-muted-foreground">Turn off to hide the product.</p>
                </div>
                <Switch
                  checked={values.isActive}
                  onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: checked }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Mark sold out</p>
                  <p className="text-xs text-muted-foreground">Keep it visible but unavailable.</p>
                </div>
                <Switch
                  checked={values.isSoldOut}
                  onCheckedChange={(checked) => setValues((current) => ({ ...current, isSoldOut: checked }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Storefront badge</p>
              <p className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-bone">
                {previewBadge ?? "Live"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="images">Product images</Label>
            <label
              htmlFor="images"
              className="flex cursor-pointer items-center justify-center gap-3 rounded-3xl border border-dashed border-border/70 bg-background/30 px-5 py-10 text-center transition-colors hover:border-blood/60 hover:bg-background/50"
            >
              <ImagePlus className="h-5 w-5 text-blood" />
              <div>
                <p className="text-sm font-medium">Upload multiple images</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP. Front, back, details, lifestyle.</p>
              </div>
            </label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files)}
            />

            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-3xl border border-border/70 bg-background/40">
                    <img src={image.imageUrl} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleExistingImageRemove(image)}
                      className="flex w-full items-center justify-center gap-2 border-t border-border/70 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                ))}

                {newFiles.map((file) => (
                  <div key={file.previewUrl} className="overflow-hidden rounded-3xl border border-border/70 bg-background/40">
                    <img src={file.previewUrl} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleNewFileRemove(file)}
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
