import { Link } from "@tanstack/react-router";
import {
  formatMoney,
  getPrimaryImage,
  getProductBadge,
  getPrimaryVideo,
  getSecondaryImage,
  getShortDescription,
  type StoreProduct,
} from "@/lib/catalog";

export function ProductCard({ product }: { product: StoreProduct }) {
  const badge = getProductBadge(product);
  const primaryVideo = getPrimaryVideo(product);
  const primaryImage = getPrimaryImage(product);
  const secondaryImage = getSecondaryImage(product);
  const hasPrimaryImage = Boolean(primaryImage);

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-bone/60 focus:ring-offset-2 focus:ring-offset-background">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_20px_50px_-35px_rgba(0,0,0,0.9)] transition-transform duration-200 group-active:scale-[0.985] group-hover:-translate-y-0.5">
        {badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-bone px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-background">
            {badge}
          </span>
        )}
        <div className="relative aspect-square overflow-hidden">
          {primaryVideo ? (
            <video
              src={primaryVideo}
              aria-label={product.name}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            hasPrimaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={product.name}
                className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                loading="lazy"
              />
              <img
                src={secondaryImage}
                alt={`${product.name} alternate view`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                loading="lazy"
              />
            </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-card text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                JR Lifestyle
              </div>
            )
          )}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wider text-foreground">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{getShortDescription(product)}</p>
        </div>
        <span className="shrink-0 font-display text-base text-bone">{formatMoney(product.price)}</span>
      </div>
    </Link>
  );
}
