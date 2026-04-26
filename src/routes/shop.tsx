import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { fetchStoreProducts, type StoreProduct } from "@/lib/catalog";

export const Route = createFileRoute("/shop")({
  loader: async () => ({
    products: await fetchStoreProducts(),
  }),
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop — JR Lifestyle" },
      { name: "description", content: "Shop all pieces from JR Lifestyle Clothing. Premium streetwear, limited drops." },
    ],
  }),
});

function ShopPage() {
  const { products }: { products: StoreProduct[] } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border/60 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">All Pieces</p>
          <h1 className="mt-2 font-display text-5xl uppercase tracking-wider text-foreground md:text-8xl">
            The <span className="text-bone font-script text-5xl md:text-7xl">archive</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Tap into the full JR Lifestyle lineup, including in-stock tees and preorder drops made for the ones who carry confidence into every room.
          </p>
        </div>
      </section>
      <section className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-x-4 gap-y-8 px-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-14">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
