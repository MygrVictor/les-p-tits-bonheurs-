import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { getBentoStoreProducts } from "@/lib/storefront";
import { ArrowRight } from "lucide-react";

function ProductCard({
  product,
  className = "",
  priority = false,
}: {
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    salePrice: number | null;
    isNew: boolean;
  };
  className?: string;
  priority?: boolean;
}) {
  const discountPct = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  return (
    <Link
      href={`/produit/${product.id}`}
      className={`group relative overflow-hidden rounded-3xl bg-neutral-100 ${className}`}
    >
      <SafeImage
        src={product.images[0]}
        alt={product.name}
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 50vw"
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

export async function BentoNouveautes() {
  const bentoItems = await getBentoStoreProducts(5);

  if (bentoItems.length === 0) {
    return (
      <section className="space-y-3 rounded-3xl bg-white p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ Dernières arrivées
        </p>
        <h2 className="font-serif text-3xl text-ink sm:text-4xl">Nouveautés</h2>
        <p className="text-sm text-neutral-600">
          Ajoute des produits actifs depuis l&apos;admin pour remplir cette
          section.
        </p>
      </section>
    );
  }

  const [main, second, third, fourth, fifth] = bentoItems;

  return (
    <section className="space-y-3">
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ Dernières arrivées
          </p>
          <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
            Nouveautés
          </h2>
        </div>
        <Link
          href="/nouveautes"
          className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Tout voir <ArrowRight size={13} />
        </Link>
      </div>

      {/* Bento — ligne haute */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {/* Grande carte — occupe 2 cols sur mobile, 2 cols sur md */}
        {main && (
          <ProductCard
            product={main}
            className="col-span-2 h-72 sm:h-80 md:h-96"
            priority
          />
        )}

        {/* 2 cartes empilées à droite — visibles uniquement md+ */}
        <div className="hidden flex-col gap-3 md:flex">
          {second && <ProductCard product={second} className="flex-1" />}
          {third && <ProductCard product={third} className="flex-1" />}
        </div>

        {/* Cartes visibles uniquement sur mobile (1 col chacune) */}
        {second && <ProductCard product={second} className="h-48 md:hidden" />}
        {third && <ProductCard product={third} className="h-48 md:hidden" />}
      </div>

      {/* Bento — ligne basse */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {fourth && <ProductCard product={fourth} className="h-48" />}
        {fifth && <ProductCard product={fifth} className="h-48" />}

        {/* Cellule CTA */}
        <div className="col-span-2 flex flex-col items-start justify-between rounded-3xl bg-primary/8 p-6 ring-1 ring-primary/20 md:col-span-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Nouveautés
            </p>
            <p className="font-serif text-2xl leading-snug text-ink sm:text-3xl">
              Des pièces choisies avec passion par Pauline.
            </p>
          </div>
          <Link
            href="/nouveautes"
            className="mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Découvrir <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
