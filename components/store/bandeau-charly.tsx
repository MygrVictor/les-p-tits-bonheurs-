import Link from "next/link";

const IMAGES = [
  "/charly-therapy.jpg",
  "/charly-therapy2.jpg",
  "/charly-thérapy3.jpg",
  "/charly-thérapy4.jpg",
];

// 3 répétitions pour une boucle sans saut visible
const track = [...IMAGES, ...IMAGES, ...IMAGES];

export function BandeauCharly() {
  return (
    <Link
      href="/categorie/lifestyle"
      className="group block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-400"
      aria-label="Découvrir la collection Charly Therapy — Lunettes de soleil"
    >
      {/* Bandeau défilant */}
      <div className="relative h-48 overflow-hidden sm:h-64 md:h-80">
        {/* Masques de fondu sur les bords */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-28" />

        {/* Overlay sombre au hover avec CTA */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-all duration-500 group-hover:bg-black/25">
          <span className="translate-y-2 rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-ink opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Découvrir la collection →
          </span>
        </div>

        {/* Piste défilante : 4 images en boucle continue */}
        <div className="flex h-full animate-marquee-band will-change-transform">
          {track.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              aria-hidden="true"
              className="h-full w-auto shrink-0 object-cover"
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* Étiquette sous le bandeau — décalée à droite */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-white pl-[10%] pr-4 py-3 sm:pr-6">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-blush-400" />
          <span className="font-serif text-base text-ink sm:text-lg">
            Charly Therapy
          </span>
          <span className="hidden text-xs uppercase tracking-widest text-neutral-400 sm:inline">
            · Lunettes de soleil
          </span>
        </div>
        <span className="text-xs font-medium uppercase tracking-widest text-blush-600 transition group-hover:underline">
          Voir la collection
        </span>
      </div>
    </Link>
  );
}
