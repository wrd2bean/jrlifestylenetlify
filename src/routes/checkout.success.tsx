import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { finalizeCheckoutSession } from "@/lib/checkout";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : "",
  }),
  component: CheckoutSuccessPage,
  head: () => ({
    meta: [
      { title: "Checkout Success — JR Lifestyle" },
      { name: "description", content: "Your JR Lifestyle order has been placed successfully." },
    ],
  }),
});

function CheckoutSuccessPage() {
  const search = Route.useSearch();
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function finalize() {
      if (!search.session_id) {
        setErrorMessage("Missing checkout session.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await finalizeCheckoutSession({
          data: { sessionId: search.session_id },
        });
        setOrderNumber(result.orderNumber);
        clearCart();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to confirm your order.");
      } finally {
        setIsLoading(false);
      }
    }

    void finalize();
  }, [clearCart, search.session_id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        {isLoading ? (
          <div className="space-y-4">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blood" />
            <p className="text-muted-foreground">Finalizing your order...</p>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4">
            <h1 className="font-display text-5xl uppercase tracking-[0.08em]">Payment Received</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <CheckCircle2 className="mx-auto h-14 w-14 text-bone" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Order Confirmed</p>
              <h1 className="mt-3 font-display text-6xl uppercase tracking-[0.08em]">Thank You</h1>
            </div>
            <p className="text-muted-foreground">
              Your order was paid successfully{orderNumber ? ` and saved as ${orderNumber}` : ""}.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/shop"
                className="bg-bone px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
              >
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="border border-border px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-foreground transition-colors hover:border-foreground"
              >
                Back Home
              </Link>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
