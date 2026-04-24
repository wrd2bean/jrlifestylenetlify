import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="font-display text-3xl tracking-wider text-foreground">
              JR <span className="font-script text-2xl text-bone">Lifestyle</span>
            </h3>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Streetwear for the ones who bet on themselves. Born to Win — the inaugural drop.
            </p>
            <form className="mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button className="bg-bone px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-background hover:bg-foreground transition-colors">
                Notify
              </button>
            </form>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-foreground">All Pieces</Link></li>
              <li><Link to="/drop" className="hover:text-foreground">Born To Win</Link></li>
              <li><Link to="/about" className="hover:text-foreground">Lookbook</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Info</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">Our Story</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/size-guide" className="hover:text-foreground">Size Guide</Link></li>
              <li><Link to="/return-policy" className="hover:text-foreground">Returns</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} JR Lifestyle Clothing</span>
          <span>Born To Win — Drop 001</span>
        </div>
      </div>
    </footer>
  );
}
