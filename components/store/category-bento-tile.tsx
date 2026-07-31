"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/image";

type Props = {
  href: string;
  family: string;
  title: string;
  images: string[];
};

export function CategoryBentoTile({ href, family, title, images }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = images.length;

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 3000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrent((c) => (c - 1 + total) % total);
    resetTimer();
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrent((c) => (c + 1) % total);
    resetTimer();
  };

  return (
    <Link
      href={href}
      className="group relative aspect-square overflow-hidden border border-black/5 bg-neutral-100 shadow-soft"
    >
      {images.map((src, i) => (
        <SafeImage
          key={src + i}
          src={src}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          } ${i === 0 ? "" : "absolute inset-0"}`}
          sizes="(max-width: 640px) 50vw, 33vw"
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Flèches discrètes */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Image précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-1 text-white/60 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            aria-label="Image suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-1 text-white/60 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* Indicateurs de position */}
      {total > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                i === current ? "bg-white scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
          {family}
        </p>
        <p className="font-serif text-lg text-white sm:text-xl">{title}</p>
      </div>
    </Link>
  );
}
