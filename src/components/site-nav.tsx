import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
        <button className="text-foreground md:hidden" aria-label="menu">
          <Menu className="h-5 w-5" />
        </button>
        <nav className="hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:flex">
          <Link to="/shop" className="transition-colors hover:text-foreground">Shop</Link>
          <Link to="/drop" className="transition-colors hover:text-foreground">The Drop</Link>
          <Link to="/about" className="transition-colors hover:text-foreground">Lookbook</Link>
        </nav>
        <Link to="/" className="font-display text-xl tracking-[0.15em] text-foreground">
          JR <span className="font-script text-base text-bone">Lifestyle</span>
        </Link>
        <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/about" className="hidden transition-colors hover:text-foreground md:inline">Story</Link>
          <Link to="/admin" className="hidden transition-colors hover:text-foreground md:inline">Admin</Link>
          <button className="flex items-center gap-1.5 transition-colors hover:text-foreground" aria-label="cart">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Bag (0)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
