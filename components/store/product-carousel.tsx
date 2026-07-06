import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { ArrowRight } from "lucide-react";

export type CarouselProduct = {
  id: string;
  name: string;
  images: string[];
  price: number;
  salePrice: number | null;
  isNew: boolean;
};

/**
 * Rangée de produits défilable horizontalement (swipe/scroll natif + snap),
 * réutilisée pour « Nouveautés » et « Les coups de cœur » sur la page
 * d'accueil. Purement CSS (overflow-x-auto + scroll-snap) : pas de JS, pas
 * de "use client" nécessaire, cohérent avec les autres rangées défilables du
 * site (CategoryPills, FilterPierres).
 */
export function ProductCarousel({
  kicker,
  title,
  viewAllHref,
  viewAllLabel = "Tout voir",
  products,
  emptyMessage,
}: Readonly<{
  kicker: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  products: CarouselProduct[];
  emptyMessage: string;
}>) {
  return (
    <section className="space-y-3">
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {kicker}
          </p>
          <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
            {title}
          </h2>
        </div>
        {viewAllHref && products.length > 0 && (
          <Link
            href={viewAllHref}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            {viewAllLabel} <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
          <p className="text-sm text-neutral-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex snap-x snap-mandatory gap-3 scroll-smooth sm:gap-4">
            {products.map((product, index) => (
              <CarouselCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CarouselCard({
  product,
  priority,
}: Readonly<{ product: CarouselProduct; priority: boolean }>) {
  const discountPct = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  return (
    <Link
      href={`/produit/${product.id}`}
      className="group relative block aspect-[3/4] w-40 shrink-0 snap-start overflow-hidden rounded-3xl bg-neutral-100 sm:w-52"
    >
      <SafeImage
        src={product.images[0]}
        alt={product.name}
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 40vw, 20vw"
        priority={priority}
      />

      {/* Dégradé bas */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Badges */}
      {product.isNew && (
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
          Nouveau
        </span>
      )}
      {discountPct && (
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-rose-600 shadow">
          −{discountPct}%
        </span>
      )}

      {/* Nom + Prix */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="truncate text-sm font-semibold text-white drop-shadow">
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-bold text-white/90">
          {(product.salePrice ?? product.price).toFixed(0)} €
          {product.salePrice && (
            <span className="ml-2 text-xs font-normal text-white/50 line-through">
              {product.price.toFixed(0)} €
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
