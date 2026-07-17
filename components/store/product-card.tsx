import Link from "next/link";
import { SafeImage } from "@/components/ui/image";
import { Product } from "@/lib/catalog";
import { WishlistButton } from "@/components/store/wishlist-button";
import { QuickAddToCart } from "@/components/store/quick-add-to-cart";

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const displayedPrice = product.salePrice ?? product.price;
  const hasDiscount =
    typeof product.salePrice === "number" && product.salePrice < product.price;

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/produit/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-blush-50 sm:aspect-[10/11]">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            width={800}
            height={1000}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAAAAACw="
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3">
            <WishlistButton
              productId={product.id}
              size={16}
              className="h-8 w-8 rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
            />
          </div>
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink shadow-sm backdrop-blur-sm">
              {product.isNew ? "Nouveauté" : "Sélection"}
            </span>
          </div>
        </div>
        <div className="space-y-2 p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-[2.75rem] font-serif text-base leading-snug text-ink sm:text-lg">
            {product.name}
          </h3>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-ink sm:text-lg">
                {displayedPrice} €
              </p>
              {hasDiscount && (
                <p className="text-xs text-neutral-400 line-through sm:text-sm">
                  {product.price} €
                </p>
              )}
            </div>
            <span className="text-[11px] text-neutral-500">
              {product.stock > 0 ? "En stock" : "Rupture"}
            </span>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-neutral-600 sm:text-sm sm:leading-6">
            {product.description}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          href={`/produit/${product.id}`}
          className="text-xs font-medium text-neutral-500 transition hover:text-ink"
        >
          Voir le détail
        </Link>
        <QuickAddToCart product={product} />
      </div>
    </article>
  );
}
