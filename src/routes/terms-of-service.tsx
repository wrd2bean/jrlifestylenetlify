import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
  head: () => ({
    meta: [
      { title: "Terms of Service — JR Lifestyle" },
      { name: "description", content: "JR Lifestyle store terms of service." },
    ],
  }),
});

function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Legal</p>
        <h1 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] sm:text-6xl">Terms of Service</h1>
        <div className="mt-8 space-y-4 text-base leading-7 text-muted-foreground">
          <p>By using this site, you agree to provide accurate checkout information and not misuse the storefront or content.</p>
          <p>Product availability, preorder timing, and shipping windows may change based on production and fulfillment conditions.</p>
          <p>JR Lifestyle reserves the right to cancel fraudulent or abusive orders.</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
