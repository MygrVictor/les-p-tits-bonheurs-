import Link from "next/link";
import Image from "next/image";

export function BentoBoutique() {
  return (
    <section className="space-y-4">
      {/* En-tête */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ La boutique
          </p>
          <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
            Un univers choisi avec soin.
          </h2>
        </div>
        <Link
          href="/a-propos"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Notre histoire →
        </Link>
      </div>

      {/* Bento photos */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 md:grid-cols-3">
        {/* Grande photo gauche — 2 lignes */}
        <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl">
          <Image
            src="/atelier.jpg"
            alt="L'atelier de Pauline"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        {/* Photo haut droite */}
        <div className="relative col-span-1 h-48 overflow-hidden rounded-3xl sm:h-56">
          <Image
            src="/hero.jpg"
            alt="La boutique"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        {/* Photo bas droite */}
        <div className="relative col-span-1 h-48 overflow-hidden rounded-3xl sm:h-56">
          <Image
            src="/perlerie.jpg"
            alt="Les créations"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        {/* Cellule texte — desktop : 3e colonne sur toute la hauteur */}
        <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-primary/8 p-6 ring-1 ring-primary/20 md:col-span-1 md:row-span-2 md:row-start-1 md:col-start-3">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Pauline
            </p>
            <p className="font-serif text-2xl leading-snug text-ink sm:text-3xl">
              Horlogère devenue créatrice.
            </p>
            <p className="text-sm leading-7 text-neutral-600">
              Chaque pièce est sélectionnée avec passion — bijoux, mode, déco,
              papeterie. Un univers bohème et coloré, empreint de poésie.
            </p>
          </div>
          <blockquote className="mt-6 border-l-2 border-primary/40 pl-4">
            <p className="text-sm italic leading-6 text-neutral-500">
              &laquo;&nbsp;C&apos;est véritablement utile puisque c&apos;est
              joli.&nbsp;&raquo;
            </p>
            <footer className="mt-1 text-xs text-neutral-400">
              — Antoine de Saint-Exupéry
            </footer>
          </blockquote>
          <Link
            href="/a-propos"
            className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Découvrir notre histoire
          </Link>
        </div>
      </div>
    </section>
  );
}
