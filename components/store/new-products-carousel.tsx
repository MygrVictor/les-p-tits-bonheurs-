"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/image";
import { WishlistButton } from "@/components/store/wishlist-button";
import type { Product } from "@/lib/catalog";

export function NewProductsCarousel({
  products,
}: Readonly<{ products: Product[] }>) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = track.querySelector("article")?.offsetWidth ?? 260;
    const gap = 16;
    track.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Boutons navigation */}
      <button
        onClick={() => scroll("left")}
        aria-label="Précédent"
        className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-blush-50 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        aria-label="Suivant"
        className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-blush-50 sm:flex"
      >
        <ChevronRight size={20} />
      </button>

      {/* Piste scrollable */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => {
          const displayedPrice = product.salePrice ?? product.price;
          const hasDiscount =
            typeof product.salePrice === "number" &&
            product.salePrice < product.price;

          return (
            <article
              key={product.id}
              className="group w-[220px] shrink-0 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-[240px]"
            >
              <Link href={`/produit/${product.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-blush-50">
                  <SafeImage
                    src={product.images[0]}
                    alt={product.name}
                    width={480}
                    height={480}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute right-2 top-2">
                    <WishlistButton
                      productId={product.id}
                      size={15}
                      className="h-7 w-7 rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
                    />
                  </div>
                  <div className="absolute left-2 top-2">
                    <span className="inline-flex items-center rounded-full bg-blush-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
                      Nouveauté
                    </span>
                  </div>
                  {hasDiscount && (
                    <div className="absolute bottom-2 left-2">
                      <span className="inline-flex items-center rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Promo
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <h3 className="line-clamp-2 min-h-[2.5rem] font-serif text-sm leading-snug text-ink">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {displayedPrice} €
                    </p>
                    {hasDiscount && (
                      <p className="text-xs text-neutral-400 line-through">
                        {product.price} €
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
