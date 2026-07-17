"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/image";
import { newBrands, type NewBrand } from "@/lib/new-brands";

/** Une slide = les 3 photos d'UNE marque, collées côte à côte (sans gap, angles carrés). */
function BrandSlidePhotos({ brand }: Readonly<{ brand: NewBrand }>) {
  const photos = brand.images.slice(0, 3);

  return (
    <div className="flex w-full shrink-0 snap-start">
      {photos.map((src, i) => (
        <div
          key={`${brand.id}-${i}`}
          className="relative aspect-[3/4] flex-1 overflow-hidden bg-neutral-100 sm:aspect-[4/5]"
        >
          <SafeImage
            src={src}
            alt={`${brand.name} — photo ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 25vw"
            priority={i === 0}
          />
        </div>
      ))}
    </div>
  );
}

export function NewBrandsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToSlide = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
  };

  const scrollByOne = (direction: 1 | -1) => {
    scrollToSlide(
      Math.min(Math.max(activeIndex + direction, 0), newBrands.length - 1),
    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(index);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (newBrands.length === 0) return null;

  const activeBrand = newBrands[activeIndex] ?? newBrands[0];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ Nouveau dans la boutique
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
          Nouveautés
        </h2>
      </div>

      {/* Piste défilante — 1 slide = 1 marque + ses 3 photos */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {newBrands.map((brand) => (
            <BrandSlidePhotos key={brand.id} brand={brand} />
          ))}
        </div>

        {newBrands.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollByOne(-1)}
              disabled={activeIndex === 0}
              aria-label="Marque précédente"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByOne(1)}
              disabled={activeIndex === newBrands.length - 1}
              aria-label="Marque suivante"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Étiquette de la marque active — se met à jour au fil du défilement */}
      <Link
        href={activeBrand.href}
        className="group flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
          <span className="font-serif text-base text-ink sm:text-lg">
            {activeBrand.name}
          </span>
          {activeBrand.tagline && (
            <span className="hidden text-xs uppercase tracking-widest text-neutral-400 sm:inline">
              · {activeBrand.tagline}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-primary transition group-hover:underline">
          Voir la collection →
        </span>
      </Link>

      {/* Points de pagination — 1 par marque */}
      {newBrands.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {newBrands.map((brand, i) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => scrollToSlide(i)}
              aria-label={`Voir ${brand.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
