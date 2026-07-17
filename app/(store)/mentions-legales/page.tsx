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
            <strong>Les P&apos;tits Bonheurs</strong> — Entreprise individuelle
            <br />
            SIREN : 123 456 789 (à remplacer par votre SIREN réel)
            <br />
            Siège social : 12 rue des Artisans, 44000 Nantes, France
            <br />
            Responsable de la publication : Pauline Dupont
            <br />
            Email :{" "}
            <a
              href="mailto:bonjour@lespetitsbonheurs.fr"
              className="text-primary hover:underline"
            >
              bonjour@lespetitsbonheurs.fr
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Hébergement</h2>
          <p>
            Ce site est hébergé par <strong>Vercel Inc.</strong>
            <br />
            340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis
            <br />
            Site web :{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              vercel.com
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, visuels,
            logo, photographies) est la propriété exclusive de Les P&apos;tits
            Bonheurs, sauf mention contraire. Toute reproduction, distribution
            ou utilisation sans autorisation écrite préalable est strictement
            interdite.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Responsabilité</h2>
          <p>
            Les P&apos;tits Bonheurs s&apos;efforce de maintenir les
            informations du site exactes et à jour, mais ne saurait être tenu
            responsable d&apos;erreurs, omissions ou d&apos;indisponibilités
            temporaires du service.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Délégué à la protection des données (DPO)
          </h2>
          <p>
            Pour toute question relative à la protection de vos données
            personnelles, vous pouvez contacter notre responsable à
            l&apos;adresse :{" "}
            <a
              href="mailto:bonjour@lespetitsbonheurs.fr"
              className="text-primary hover:underline"
            >
              bonjour@lespetitsbonheurs.fr
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Règlement des litiges
          </h2>
          <p>
            En cas de litige, vous pouvez recourir gratuitement au service de
            médiation de la consommation. Plateforme européenne de résolution
            des litiges :{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
