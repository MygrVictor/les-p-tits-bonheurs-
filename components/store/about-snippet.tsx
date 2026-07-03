import Link from "next/link";
import Image from "next/image";

export function AboutSnippet() {
  return (
    <section className="rounded-[2rem] bg-white px-8 py-12 shadow-soft sm:px-12 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:py-14">
      <div className="space-y-5">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          L&apos;histoire de la boutique
        </p>
        <h2 className="font-serif text-4xl leading-tight text-ink">
          Bonjour, je suis Pauline.
        </h2>
        <p className="text-base leading-8 text-neutral-700">
          Horlogère de formation, c&apos;est au fil de mon parcours et de belles
          rencontres que je me suis tournée vers la création de bijoux.
          J&apos;y exprime aujourd&apos;hui ma passion pour les détails, les couleurs
          et les créations qui ont une âme.
        </p>
        <Link
          href="/a-propos"
          className="inline-block rounded-full border border-ink/15 bg-blush-50 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-blush-100"
        >
          Lire notre histoire →
        </Link>
      </div>

      <div className="mt-8 lg:mt-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-soft">
          <Image
            src="/atelier.jpg"
            alt="L'atelier de Pauline"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/80 px-4 py-3 backdrop-blur-sm">
            <p className="font-serif text-sm text-ink">
              &laquo;&nbsp;C&apos;est véritablement utile puisque c&apos;est joli.&nbsp;&raquo;
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">— Antoine de Saint-Exupéry</p>
          </div>
        </div>
      </div>
    </section>
  );
}
