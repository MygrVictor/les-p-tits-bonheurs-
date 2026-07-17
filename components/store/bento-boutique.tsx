import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

/**
 * Section « La boutique » de la home page — bento de photos + carte CTA,
 * recentré sur l'univers/le concept de la boutique (plutôt que sur
 * l'histoire personnelle de Pauline, qui n'a plus de page dédiée).
 */
export function BentoBoutique() {
  return (
    <section className="space-y-5">
      {/* En-tête */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ La boutique
        </p>
        <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
          Un univers choisi avec soin.
        </h2>
      </div>

      {/* Bento photos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative col-span-1 aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush-50">
            <Image
              src="/atelier.jpg"
              alt="L'atelier"
              fill
              className="object-cover transition duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 35vw"
            />
          </div>

          <div className="relative col-span-1 aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush-50 sm:mt-10">
            <Image
              src="/hero.jpg"
              alt="La boutique"
              fill
              className="object-cover transition duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[2rem] border border-primary/15 bg-[#fff5f8] p-7 sm:p-8">
          <div className="space-y-4">
            <Sparkles size={18} className="text-primary" />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                Présentation
              </p>
              <p className="font-serif text-2xl leading-snug text-ink sm:text-3xl">
                Une boutique douce, colorée et pensée pour faire plaisir.
              </p>
              <p className="text-sm leading-7 text-neutral-600">
                Bijoux, accessoires et objets choisis avec attention, dans un
                univers féminin, solaire et facile à offrir.
              </p>
            </div>
            <blockquote className="rounded-2xl border border-white/70 bg-white/70 px-5 py-4 text-sm italic leading-6 text-neutral-500 shadow-sm">
              Une sélection sensible, joyeuse et pleine de petits détails qui
              font la différence.
            </blockquote>
          </div>

          <Link
            href="/nouveautes"
            className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Découvrir la boutique <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
