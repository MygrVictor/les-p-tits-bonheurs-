import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { Product } from "@/lib/catalog";

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const displayedPrice = product.salePrice ?? product.price;

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-soft transition duration-200 hover:-translate-y-1">
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-blush-50">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            width={800}
            height={1000}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAAAAACw="
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-blush-600 sm:text-xs sm:tracking-[0.28em]">
                {product.isNew ? "Nouveauté" : "Sélection"}
              </p>
              <h3 className="mt-1 font-serif text-base leading-snug text-ink sm:mt-2 sm:text-2xl">
                {product.name}
              </h3>
            </div>
            <p className="shrink-0 text-sm font-semibold text-blush-700 sm:text-lg">
              {displayedPrice} €
            </p>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-neutral-600 sm:text-sm sm:leading-6">
            {product.description}
          </p>
        </div>
      </Link>
    </article>
  );
}
