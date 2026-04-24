import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  fetchStoreProductBySlug,
  fetchStoreProducts,
  formatMoney,
  getPrimaryImage,
  getProductBadge,
  type ProductImage,
  type StoreProduct,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

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
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p>{error.message}</p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} — JR Lifestyle` : "Product" },
      { name: "description", content: loaderData?.product.description ?? "" },
      ...(loaderData ? [{ property: "og:image", content: getPrimaryImage(loaderData.product) }] : []),
    ],
  }),
});

function ProductPage() {
  const { product, products }: { product: StoreProduct; products: StoreProduct[] } = Route.useLoaderData();
  const others = products.filter((entry) => entry.slug !== product.slug).slice(0, 3);
  const [activeImage, setActiveImage] = useState(getPrimaryImage(product));
  const badge = getProductBadge(product);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 md:gap-16">
          <div>
            <div className="relative bg-card">
              <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
              {badge && (
                <span className="absolute left-4 top-4 bg-bone px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-background">
                  {badge}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {product.images.map((image: ProductImage, index: number) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImage(image.imageUrl)}
                  className={`relative aspect-square overflow-hidden border ${activeImage === image.imageUrl ? "border-bone" : "border-border"}`}
                >
                  <img src={image.imageUrl} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-background/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">
                    View {index + 1}
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
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground">Sizes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    disabled
                    className="border border-border/70 bg-black/70 px-5 py-3 text-sm font-semibold text-foreground"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled
              className="mt-8 bg-bone/70 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-background/80"
            >
              {product.status === "sold_out" || product.stockQuantity <= 0 ? "Sold Out" : "Checkout Connects Here"}
            </button>

            <div className="mt-10 space-y-3 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <p>· Stock available: {product.stockQuantity}</p>
              <p>· Colors: {product.colors.join(", ") || "Not listed"}</p>
              <p>· Sizes: {product.sizes.join(", ") || "Not listed"}</p>
              <p>· Product slug: {product.slug}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="font-display text-3xl uppercase tracking-wider text-foreground">More From The Drop</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((entry: StoreProduct) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
