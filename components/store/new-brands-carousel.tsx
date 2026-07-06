"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/image";
import { newBrands, type NewBrand } from "@/lib/new-brands";

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

function BrandSlideItem({ brand }: Readonly<{ brand: NewBrand }>) {
  return (
    <Link
      href={brand.href}
      className="group relative aspect-[3/4] flex-1 overflow-hidden rounded-3xl bg-neutral-100 sm:aspect-[4/5]"
    >
      <SafeImage
        src={brand.image}
        alt={brand.name}
        fill
        className="object-cover transition duration-700 group-hover:scale-105"
        sizes="(max-width: 640px) 33vw, 25vw"
      />

      {/* Dégradé bas pour lisibilité du texte */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Étiquette */}
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-primary shadow sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
        Nouvelle marque
      </span>

      {/* Nom + tagline */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
        <p className="font-serif text-base leading-tight text-white sm:text-xl">
          {brand.name}
        </p>
        {brand.tagline && (
          <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
            {brand.tagline}
          </p>
        )}
      </div>
    </Link>
  );
}

export function NewBrandsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = chunk(newBrands, 3);

  const scrollToSlide = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
  };

  const scrollByOne = (direction: 1 | -1) => {
    scrollToSlide(
      Math.min(Math.max(activeIndex + direction, 0), slides.length - 1),
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

      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {slides.map((slide, i) => (
            <div
              key={`slide-${i}`}
              className="flex w-full shrink-0 snap-start gap-3 sm:gap-4"
            >
              {slide.map((brand) => (
                <BrandSlideItem key={brand.id} brand={brand} />
              ))}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollByOne(-1)}
              disabled={activeIndex === 0}
              aria-label="Marques précédentes"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByOne(1)}
              disabled={activeIndex === slides.length - 1}
              aria-label="Marques suivantes"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ink shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => scrollToSlide(i)}
              aria-label={`Aller au slide ${i + 1}`}
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
