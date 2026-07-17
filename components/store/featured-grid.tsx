import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { getFeaturedStoreProducts } from "@/lib/storefront";
import { QuickAddToCart } from "@/components/store/quick-add-to-cart";

/**
 * Sélection « Coups de cœur » — présentation moderne et épurée (pas de
 * carrousel, pas de badges superposés) : grille simple, texte sous l'image
 * plutôt qu'en overlay, beaucoup d'espace blanc.
 */
export async function FeaturedGrid() {
  const products = await getFeaturedStoreProducts(4);

  if (products.length === 0) {
    return (
      <section className="space-y-4">
        <Header />
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Ajoute des produits actifs depuis l&apos;admin pour remplir cette
            sélection.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Header />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6">
        {products.map((product) => {
          const hasSale = product.salePrice !== null;

          return (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={`/produit/${product.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-neutral-50">
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 45vw, 22vw"
                  />
                  {product.isNew && (
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink shadow-sm backdrop-blur-sm">
                        Nouveau
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3 sm:p-4">
                  <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-medium text-ink sm:text-base">
                    {product.name}
                  </h3>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-sm font-semibold text-ink sm:text-base">
                      {(product.salePrice ?? product.price).toFixed(0)} €
                      {hasSale && (
                        <span className="ml-2 text-xs font-normal text-neutral-400 line-through sm:text-sm">
                          {product.price.toFixed(0)} €
                        </span>
                      )}
                    </p>
                    <span className="text-[11px] text-neutral-500">
                      {product.stock > 0 ? "En stock" : "Rupture"}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3">
                <Link
                  href={`/produit/${product.id}`}
                  className="text-xs font-medium text-neutral-500 transition hover:text-ink"
                >
                  Voir le produit
                </Link>
                <QuickAddToCart product={product} compact />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        ✦ Sélection
      </p>
      <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
        Les coups de cœur
      </h2>
    </div>
  );
}
