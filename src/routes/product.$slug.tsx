import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import {
  canPurchaseProduct,
  fetchStoreProductBySlug,
  fetchStoreProducts,
  formatMoney,
  getProductBadge,
  getProductMedia,
  getPurchaseButtonLabel,
  type ProductMedia,
  type StoreProduct,
} from "@/lib/catalog";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  loader: async ({ params }) => {
    const product = await fetchStoreProductBySlug(params.slug);
    if (!product) throw notFound();

    const products = await fetchStoreProducts();
    return { product, products };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <h1 className="font-display text-6xl uppercase tracking-wider text-foreground">Not Found</h1>
        <p className="mt-4 text-muted-foreground">This piece doesn't exist or has sold out.</p>
        <Link to="/shop" className="mt-8 inline-block bg-bone px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-background">
          Back to Shop
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} — JR Lifestyle` : "Product" },
      { name: "description", content: loaderData?.product.description ?? "" },
    ],
  }),
});

function ProductPage() {
  const { product, products }: { product: StoreProduct; products: StoreProduct[] } = Route.useLoaderData();
  const { addItem } = useCart();
  const others = products.filter((entry) => entry.slug !== product.slug).slice(0, 3);
  const media = useMemo(() => getProductMedia(product), [product]);
  const [activeMedia, setActiveMedia] = useState<ProductMedia>(media[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const badge = getProductBadge(product);
  const canPurchase = canPurchaseProduct(product);

  useEffect(() => {
    setActiveMedia(media[0]);
    setSelectedSize(product.sizes[0] ?? "");
    setSelectedColor(product.colors[0] ?? "");
  }, [media, product]);

  function handleAddToCart() {
    if (!selectedSize || !selectedColor) {
      setConfirmationMessage("Select a size and color first.");
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.images[0]?.imageUrl ?? "",
      price: product.price,
      selectedSize,
      selectedColor,
      quantity,
      isPreorder: product.isPreorder,
    });

    setConfirmationMessage(
      product.isPreorder ? "Preorder added to bag." : "Added to bag.",
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:gap-16">
          <div>
            <div className="relative bg-card">
              {activeMedia?.type === "video" ? (
                <video
                  src={activeMedia.url}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img src={activeMedia?.url} alt={product.name} className="h-full w-full object-cover" />
              )}
              {badge && (
                <span className="absolute left-4 top-4 bg-bone px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-background">
                  {badge}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMedia(item)}
                  className={`relative aspect-square overflow-hidden border ${activeMedia?.id === item.id ? "border-bone" : "border-border"}`}
                >
                  {item.type === "video" ? (
                    <video src={item.url} className="h-full w-full object-cover" autoPlay muted loop playsInline />
                  ) : (
                    <img src={item.url} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute bottom-1 left-1 bg-background/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">
                    {item.type === "video" ? "Video" : `View ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">{product.category}</p>
            <h1 className="mt-2 font-display text-5xl uppercase tracking-wider text-foreground md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-3 text-muted-foreground">{product.description}</p>
            <p className="mt-6 font-display text-3xl text-bone">{formatMoney(product.price)}</p>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">Sizes</p>
                <Link to="/size-guide" className="text-[11px] font-bold uppercase tracking-[0.22em] text-bone hover:text-foreground">
                  Size Guide
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`border px-5 py-3 text-sm font-semibold ${
                      selectedSize === size
                        ? "border-bone bg-bone text-background"
                        : "border-border/70 bg-black/70 text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">Colors</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`border px-5 py-3 text-sm font-semibold ${
                      selectedColor === color
                        ? "border-bone bg-bone text-background"
                        : "border-border/70 bg-black/70 text-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">Quantity</p>
              <div className="mt-3 inline-flex items-center border border-border/70">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="px-4 py-3 text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center font-semibold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                  className="px-4 py-3 text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!canPurchase}
              className="mt-8 h-auto bg-bone px-8 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-background hover:bg-foreground"
            >
              {getPurchaseButtonLabel(product)}
            </Button>

            {confirmationMessage && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-bone">
                <Check className="h-4 w-4" />
                {confirmationMessage}
              </p>
            )}

            <div className="mt-10 space-y-3 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <p>· Stock available: {product.stockQuantity}</p>
              <p>· Colors: {product.colors.join(", ") || "Not listed"}</p>
              <p>· Sizes: {product.sizes.join(", ") || "Not listed"}</p>
              <p>· {product.isPreorder ? "This item is currently available for preorder." : "Ships as a standard in-stock item."}</p>
              <p>· Need help? Visit support and policy pages before checkout.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="font-display text-3xl uppercase tracking-wider text-foreground">More From The Drop</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((entry) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
