import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Story — JR Lifestyle" },
      { name: "description", content: "The story behind JR Lifestyle Clothing. Streetwear for those who bet on themselves." },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="border-b border-border/60 py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Manifesto</p>
          <h1 className="mt-4 font-display text-6xl uppercase leading-none tracking-wider text-foreground md:text-8xl">
            Bet on <span className="font-script text-5xl text-bone md:text-7xl">yourself.</span>
          </h1>
          <div className="mt-12 space-y-6 text-left text-lg leading-relaxed text-muted-foreground">
            <p>
              JR Lifestyle started as a feeling — that quiet voice telling you the dream is yours
              if you're willing to roll the dice on it.
            </p>
            <p className="font-display text-3xl uppercase tracking-wide text-foreground">
              "Losers quit when they fail. Winners fail until they succeed."
            </p>
            <p>
              The Born To Win Drop pulls from the imagery of cards and dice — the iconography of
              risk. Every piece is built like armor: heavy cotton, oversized cut, prints that don't
              quit after a wash. Made in small runs because we'd rather sell out than over-produce.
            </p>
            <p>
              No luck. All God. Born to win.
            </p>
          </div>
          <div className="mt-12">
            <Link
              to="/drop"
              className="inline-block bg-bone px-8 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-background hover:bg-foreground transition-colors"
            >
              Shop The Drop
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}