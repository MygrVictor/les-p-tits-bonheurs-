import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { getFeaturedStoreProducts } from "@/lib/storefront";

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
            <Link
              key={product.id}
              href={`/produit/${product.id}`}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-50">
                <SafeImage
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 45vw, 22vw"
                />
              </div>
              <div className="mt-3 space-y-0.5">
                {product.isNew && (
                  <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
                    Nouveau
                  </p>
                )}
                <p className="truncate text-sm font-medium text-ink">
                  {product.name}
                </p>
                <p className="text-sm text-neutral-500">
                  {(product.salePrice ?? product.price).toFixed(0)} €
                  {hasSale && (
                    <span className="ml-2 text-neutral-400 line-through">
                      {product.price.toFixed(0)} €
                    </span>
                  )}
                </p>
              </div>
            </Link>
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
