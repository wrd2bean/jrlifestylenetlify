import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — JR Lifestyle" },
      { name: "description", content: "How JR Lifestyle collects and uses customer information." },
    ],
  }),
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-4xl px-5 py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Legal</p>
        <h1 className="mt-3 font-display text-6xl uppercase tracking-[0.08em]">Privacy Policy</h1>
        <div className="mt-8 space-y-4 text-muted-foreground">
          <p>We collect information needed to process orders, improve the site, and provide customer support.</p>
          <p>Payment details are processed securely by trusted payment partners and are never stored directly on the storefront.</p>
          <p>Order information is kept only as needed to fulfill purchases, provide support, and protect against fraud.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
