import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import {
  fetchHomepageFeaturedProduct,
  fetchStoreProducts,
  formatMoney,
  getPrimaryImage,
  getPurchaseButtonLabel,
  type StoreProduct,
} from "@/lib/catalog";
import { DecorBg } from "@/components/decor-bg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const products = await fetchStoreProducts();
    const homepageFeatured = await fetchHomepageFeaturedProduct();

    return {
      products,
      homepageFeatured,
    };
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "JR Lifestyle — Born To Win Drop" },
      {
        name: "description",
        content: "Premium streetwear from JR Lifestyle Clothing. Shop the Born To Win Drop — cards, dice, and the gamble of the come-up.",
      },
    ],
  }),
});

function Index() {
  const {
    products,
    homepageFeatured,
  }: { products: StoreProduct[]; homepageFeatured: StoreProduct | null } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <div className="overflow-hidden border-b border-border/60 bg-background py-3">
        <div className="flex w-max animate-marquee whitespace-nowrap font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 pr-8">
              <span>Drop 001 — Born To Win</span>
              <span className="text-blood">✦</span>
              <span>No Luck. All God.</span>
              <span className="text-blood">✦</span>
              <span>Get Rich Or Die Trying</span>
              <span className="text-blood">✦</span>
              <span>Limited Run</span>
              <span className="text-blood">✦</span>
            </div>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-border/60">
        <DecorBg />
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-spotlight)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-12 md:gap-6 md:py-24">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 border border-border bg-card/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-bone">
              <span className="h-1.5 w-1.5 rounded-full bg-blood" /> Featured Tee — Live Now
            </span>
            <h1 className="mt-6 font-display text-[18vw] leading-[0.85] tracking-tight text-foreground md:text-[10rem]">
              {homepageFeatured?.name?.split(" ").slice(0, 2).join(" ") ?? "BORN"}
              <br />
              <span className="text-blood">
                {homepageFeatured?.name?.split(" ").slice(2).join(" ") || "TO WIN"}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              {homepageFeatured?.description ??
                "Heavyweight streetwear for the ones who move with faith, pressure, and a winning mindset."}
            </p>
            {homepageFeatured && (
              <p className="mt-5 font-display text-3xl uppercase tracking-[0.08em] text-bone">
                {formatMoney(homepageFeatured.price)}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {homepageFeatured ? (
                <Link
                  to="/product/$slug"
                  params={{ slug: homepageFeatured.slug }}
                  className="bg-bone px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
                >
                  {getPurchaseButtonLabel(homepageFeatured)}
                </Link>
              ) : (
                <Link
                  to="/shop"
                  className="bg-bone px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
                >
                  Shop The Drop
                </Link>
              )}
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <div>
                <span className="block font-display text-2xl text-foreground">{products.length}</span>
                Styles
              </div>
              <div>
                <span className="block font-display text-2xl text-foreground">FW</span>
                Faith Wins
              </div>
              <div>
                <span className="block font-display text-2xl text-foreground">∞</span>
                Mentality
              </div>
            </div>
          </div>

          <div className="relative md:col-span-5">
            <div className="relative">
              <div
                className="absolute -inset-6 -z-10 blur-3xl"
                style={{ background: "radial-gradient(circle, oklch(0.55 0.25 25 / 0.4), transparent 70%)" }}
              />
              <div className="relative overflow-hidden bg-card">
                {homepageFeatured?.videos?.[0] ? (
                  <video
                    src={homepageFeatured.videos[0].videoUrl}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={homepageFeatured ? getPrimaryImage(homepageFeatured) : ""}
                    alt={homepageFeatured?.name ?? "Featured tee"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <span className="absolute -bottom-3 -left-3 rounded-full bg-blood px-3 py-1.5 font-display text-xs uppercase tracking-[0.3em] text-primary-foreground">
                Featured Drop
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">The Drop</p>
              <h2 className="mt-2 font-display text-4xl uppercase tracking-wider text-foreground sm:text-5xl md:text-6xl">
                Born To Win <span className="font-script text-3xl text-bone">collection</span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Shop every tee in the drop right here. Oversized cuts, heavyweight cotton, and preorder pieces for the ones already moving like winners.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              View All →
            </Link>
          </div>
          <div className="mt-10 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border/60 bg-card py-24">
        <DecorBg />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-script text-4xl text-bone">No Luck.</p>
            <h2 className="mt-2 font-display text-6xl uppercase leading-none tracking-wider text-foreground md:text-8xl">
              ALL <span className="text-blood">GOD.</span>
            </h2>
          </div>
          <div className="space-y-4 text-base text-muted-foreground">
            <p>JR Lifestyle is built for the late nights, the long odds, and the come-up that nobody saw coming.</p>
            <p>
              Every piece in this drop is heavyweight cotton, oversized by design, and made to wear like conviction. Clean lines, strong statements, and the kind of energy you bring when you already know how the story ends.
            </p>
            <Link
              to="/about"
              className="inline-block border-b border-bone pb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-bone hover:border-foreground hover:text-foreground"
            >
              Read the Manifesto →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
