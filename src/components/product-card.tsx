import { Link } from "@tanstack/react-router";
import {
  formatMoney,
  getPrimaryImage,
  getProductBadge,
  getSecondaryImage,
  getShortDescription,
  type StoreProduct,
} from "@/lib/catalog";

export function ProductCard({ product }: { product: StoreProduct }) {
  const badge = getProductBadge(product);

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative overflow-hidden bg-card">
        {badge && (
          <span className="absolute left-3 top-3 z-10 bg-bone px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-background">
            {badge}
          </span>
        )}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={getPrimaryImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
            loading="lazy"
          />
          <img
            src={getSecondaryImage(product)}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            loading="lazy"
          />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wider text-foreground">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{getShortDescription(product)}</p>
        </div>
        <span className="font-display text-base text-bone">{formatMoney(product.price)}</span>
      </div>
    </Link>
  );
}
