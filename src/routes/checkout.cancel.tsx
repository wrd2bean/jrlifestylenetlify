import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/checkout/cancel")({
  component: CheckoutCancelPage,
  head: () => ({
    meta: [
      { title: "Checkout Cancelled — JR Lifestyle" },
      { name: "description", content: "Your JR Lifestyle checkout was cancelled." },
    ],
  }),
});

function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Checkout Cancelled</p>
        <h1 className="mt-3 font-display text-6xl uppercase tracking-[0.08em]">Your Bag Is Still Waiting</h1>
        <p className="mt-6 text-muted-foreground">
          No payment was taken. You can head back to your bag and finish checkout whenever you’re ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/cart"
            className="bg-bone px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
          >
            Back To Cart
          </Link>
          <Link
            to="/shop"
            className="border border-border px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-foreground transition-colors hover:border-foreground"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
