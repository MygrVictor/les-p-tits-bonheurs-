import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Les P'tits Bonheurs",
};

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Informations légales
        </p>
        <h1 className="font-serif text-4xl text-ink">Mentions légales</h1>
      </header>

      <div className="space-y-6 rounded-3xl bg-white p-8 shadow-soft text-sm leading-7 text-neutral-700">
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Éditeur du site</h2>
          <p>
            Les P&apos;tits Bonheurs — entreprise individuelle
            <br />
            Responsable de la publication : Pauline
            <br />
            Email : bonjour@lespetitsbonheurs.fr
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Hébergement</h2>
          <p>
            Ce site est hébergé par un prestataire d&apos;hébergement web
            professionnel. Les coordonnées complètes de l&apos;hébergeur sont
            disponibles sur simple demande à l&apos;adresse ci-dessus.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, visuels,
            logo) est la propriété de Les P&apos;tits Bonheurs, sauf mention
            contraire, et ne peut être reproduit sans autorisation préalable.
          </p>
        </div>
      </div>
    </section>
  );
}
