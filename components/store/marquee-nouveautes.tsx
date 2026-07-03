import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { products } from "@/lib/catalog";

// Produits nouveaux en premier, puis les featured non-new
const marqueeItems = [
  ...products.filter((p) => p.isNew),
  ...products.filter((p) => p.featured && !p.isNew),
].slice(0, 8);

// 3x pour boucle continue sans saut
const track = [...marqueeItems, ...marqueeItems, ...marqueeItems];

export function MarqueeNouveautes() {
  return (
    <section className="bg-white">
      {/* En-tete */}
      <div className="px-4 pb-6 pt-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-600">
          ✦ &nbsp;Dernières arrivées&nbsp; ✦
        </p>
        <h2 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          Nouveautés
        </h2>
      </div>

      {/* Piste defilante */}
      <div className="relative overflow-hidden pb-12">
        {/* Masques de fondu lateraux */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent sm:w-32" />

        <div className="flex animate-marquee gap-0">
          {track.map((product, i) => {
            const discountPct = product.salePrice
              ? Math.round(
                  ((product.price - product.salePrice) / product.price) * 100,
                )
              : null;

            return (
              <Link
                key={`${product.id}-${i}`}
                href={`/produit/${product.id}`}
                className="group mx-3 inline-block shrink-0 sm:mx-4"
              >
                {/* Vignette image */}
                <div className="relative h-56 w-40 overflow-hidden rounded-2xl sm:h-72 sm:w-52">
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    width={416}
                    height={576}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* Degrade bas pour lisibilite du prix */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" />

                  {/* Prix en overlay */}
                  <p className="absolute bottom-3 left-3 text-base font-bold text-white">
                    {(product.salePrice ?? product.price).toFixed(0)} €
                    {product.salePrice && (
                      <span className="ml-2 text-xs font-normal text-white/50 line-through">
                        {product.price.toFixed(0)} €
                      </span>
                    )}
                  </p>

                  {/* Badge Nouveau */}
                  {product.isNew && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-blush-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink shadow">
                      Nouveau
                    </span>
                  )}

                  {/* Badge promo % */}
                  {discountPct && (
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                      \u2212{discountPct}%
                    </span>
                  )}
                </div>

                {/* Nom du produit */}
                <div className="mt-3 w-40 sm:w-52">
                  <p className="truncate text-sm font-medium text-ink/60 transition group-hover:text-ink">
                    {product.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
