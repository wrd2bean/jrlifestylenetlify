import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/return-policy")({
  component: ReturnPolicyPage,
  head: () => ({
    meta: [
      { title: "Return Policy — JR Lifestyle" },
      { name: "description", content: "JR Lifestyle return and refund policy for streetwear orders and preorders." },
    ],
  }),
});

function ReturnPolicyPage() {
  return (
    <PolicyPage
      kicker="Support"
      title="Return Policy"
      body={[
        "Returns are accepted within 14 days of delivery for unworn, unwashed items in original condition.",
        "Preorder items can be canceled before shipment. Once shipped, they follow the same 14-day return window.",
        "Shipping costs are non-refundable unless the item arrives damaged or incorrect.",
      ]}
    />
  );
}

function PolicyPage({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string[];
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">{kicker}</p>
        <h1 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] sm:text-6xl">{title}</h1>
        <div className="mt-8 space-y-4 text-base leading-7 text-muted-foreground">
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
