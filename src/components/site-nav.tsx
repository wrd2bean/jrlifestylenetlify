import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu } from "lucide-react";
import { useCart } from "@/lib/cart";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SiteNav() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const mobileLinks = [
    { to: "/shop", label: "Shop" },
    { to: "/drop", label: "Drop" },
    { to: "/about", label: "Story" },
    { to: "/size-guide", label: "Size Guide" },
    { to: "/return-policy", label: "Return Policy" },
    { to: "/contact", label: "Contact / Support" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-5">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/50 text-foreground transition-colors hover:border-bone/60 hover:text-bone md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] border-border/70 bg-background px-5 py-6 sm:max-w-sm">
            <SheetHeader className="border-b border-border/60 pb-5">
              <SheetTitle className="font-display text-2xl uppercase tracking-[0.12em]">
                JR <span className="font-script text-lg text-bone">Lifestyle</span>
              </SheetTitle>
              <SheetDescription>
                Heavyweight streetwear, preorder drops, and a winning mindset.
              </SheetDescription>
            </SheetHeader>

            <nav className="mt-6 flex flex-col gap-2">
              {mobileLinks.map((link) => (
                <SheetClose asChild key={link.to}>
                  <Link
                    to={link.to}
                    className="flex min-h-12 items-center rounded-2xl border border-border/60 bg-card/40 px-4 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-bone/60 hover:text-bone"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link
                  to="/cart"
                  className="mt-2 flex min-h-12 items-center justify-between rounded-2xl bg-bone px-4 text-sm font-bold uppercase tracking-[0.18em] text-background"
                >
                  <span>Bag</span>
                  <span>({itemCount})</span>
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
        <nav className="hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:flex">
          <Link to="/shop" className="transition-colors hover:text-foreground">Shop</Link>
          <Link to="/drop" className="transition-colors hover:text-foreground">The Drop</Link>
          <Link to="/about" className="transition-colors hover:text-foreground">Lookbook</Link>
        </nav>
        <Link to="/" className="font-display text-lg tracking-[0.15em] text-foreground sm:text-xl">
          JR <span className="font-script text-base text-bone">Lifestyle</span>
        </Link>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:gap-5">
          <Link to="/about" className="hidden transition-colors hover:text-foreground md:inline">Story</Link>
          <Link
            to="/cart"
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 transition-colors hover:border-bone/60 hover:text-foreground"
            aria-label="cart"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Bag ({itemCount})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
