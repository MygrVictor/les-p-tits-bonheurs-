import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Heart, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos — Les P'tits Bonheurs",
  description:
    "Découvrez l'histoire de Pauline, horlogère de formation devenue créatrice de bijoux. Bijoux, mode, déco et papeterie choisis avec passion.",
};

export default function AboutPage() {
  return (
    <div className="space-y-20">
      {/* Hero section */}
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush-100 to-blush-300/40 px-6 py-16 shadow-soft sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-16 lg:py-20">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-blush-700">
            Notre histoire
          </p>
          <h1 className="font-serif text-5xl leading-tight text-ink sm:text-6xl">
            Bonjour,
            <br />
            je suis Pauline.
          </h1>
          <p className="text-base leading-8 text-neutral-700">
            Horlogère de formation, c&apos;est au fil de mon parcours et de
            belles rencontres que je me suis tournée vers la création de bijoux.
            J&apos;y exprime aujourd&apos;hui ma passion pour les détails, les
            couleurs et les créations qui ont une âme.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/categorie/bijoux"
              className="rounded-full bg-ink px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Découvrir mes bijoux
            </Link>
            <Link
              href="/"
              className="rounded-full border border-ink/15 bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:bg-blush-50"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        {/* Quote card */}
        <div className="mt-10 lg:mt-0">
          <blockquote className="rounded-[2rem] bg-white p-8 shadow-soft">
            <Sparkles size={28} className="mb-4 text-blush-400" />
            <p className="font-serif text-2xl leading-relaxed text-ink">
              &laquo;&nbsp;C&apos;est véritablement utile puisque c&apos;est
              joli.&nbsp;&raquo;
            </p>
            <footer className="mt-4 text-sm text-neutral-500">
              — Antoine de Saint-Exupéry&nbsp;✨
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Story body */}
      <section className="mx-auto max-w-3xl space-y-8 px-4">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft space-y-6">
          <div className="flex items-start gap-4">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100">
              <Heart size={18} className="text-blush-600" />
            </span>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-ink">
                Un univers bohème et poétique
              </h2>
              <p className="text-base leading-8 text-neutral-700">
                Inspirée par la beauté des petites choses du quotidien,
                j&apos;ai imaginé un univers bohème, coloré et empreint de
                poésie. J&apos;aime créer, mais aussi dénicher des pépites
                capables d&apos;émerveiller petits et grands.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-soft space-y-6">
          <div className="flex items-start gap-4">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100">
              <Star size={18} className="text-blush-600" />
            </span>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-ink">
                Des marques choisies avec soin
              </h2>
              <p className="text-base leading-8 text-neutral-700">
                Pour compléter cet univers qui me ressemble, je collabore avec
                des marques et créateurs français sélectionnés avec soin, en
                privilégiant le savoir-faire, l&apos;authenticité et les belles
                histoires.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-blush-300/30 p-8 shadow-soft text-center space-y-4">
          <Sparkles size={32} className="mx-auto text-blush-600" />
          <p className="font-serif text-xl leading-relaxed text-ink">
            Bienvenue dans mon univers, où chaque création et chaque découverte
            sont choisies avec passion, parce qu&apos;un peu de beauté a parfois
            le pouvoir d&apos;illuminer une journée.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
            Mes engagements
          </p>
          <h2 className="mt-2 font-serif text-4xl text-ink">
            Ce qui me tient à cœur
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              emoji: "✨",
              title: "Savoir-faire artisanal",
              desc: "Chaque pièce est pensée dans les moindres détails, alliant technique horlogère et sensibilité créative.",
            },
            {
              emoji: "🌸",
              title: "Beauté du quotidien",
              desc: "Des créations qui illuminent les moments simples — un bijou porté, un objet déposé sur une étagère.",
            },
            {
              emoji: "🇫🇷",
              title: "Marques françaises",
              desc: "Une sélection de créateurs français choisis pour leur authenticité, leur univers et leurs belles histoires.",
            },
            {
              emoji: "🎨",
              title: "Couleurs & poésie",
              desc: "Un univers bohème, coloré et empreint de poésie pour émerveiller petits et grands.",
            },
            {
              emoji: "💎",
              title: "Bijoux avec une âme",
              desc: "Des pierres, des matières, des formes qui parlent — chaque bijou a son caractère et sa signification.",
            },
            {
              emoji: "🤝",
              title: "Passion & authenticité",
              desc: "Un conseil sincère, une relation de confiance. Je choisis avec passion ce que je vous propose.",
            },
          ].map((value) => (
            <article
              key={value.title}
              className="rounded-3xl bg-white p-6 shadow-soft space-y-3"
            >
              <span className="text-3xl">{value.emoji}</span>
              <h3 className="font-serif text-xl text-ink">{value.title}</h3>
              <p className="text-sm leading-6 text-neutral-600">{value.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[2rem] bg-ink px-8 py-14 text-center text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-300">
          Envie d&apos;en savoir plus ?
        </p>
        <h2 className="mt-4 font-serif text-4xl">Venez explorer la boutique</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/70">
          Bijoux, mode et accessoires, décoration, papeterie et maroquinerie —
          tout est choisi avec passion, pour vous.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/categorie/bijoux"
            className="rounded-full bg-blush-300 px-7 py-3 text-sm font-semibold text-ink transition hover:bg-blush-200"
          >
            Voir les bijoux
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Me contacter
          </Link>
        </div>
      </section>
    </div>
  );
}
