import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Les P'tits Bonheurs",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Informations légales
        </p>
        <h1 className="font-serif text-4xl text-ink">
          Politique de confidentialité
        </h1>
      </header>

      <div className="space-y-6 rounded-3xl bg-white p-8 shadow-soft text-sm leading-7 text-neutral-700">
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Données collectées
          </h2>
          <p>
            Lors d&apos;une commande ou de la création d&apos;un compte, nous
            collectons votre nom, votre email et votre adresse de livraison. Ces
            informations sont strictement nécessaires au traitement de vos
            commandes.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            Utilisation des données
          </h2>
          <p>
            Vos données ne sont jamais revendues à des tiers. Elles servent
            uniquement à la gestion de vos commandes, de votre compte et, si
            vous y consentez, à vous tenir informé de nos actualités.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Paiement</h2>
          <p>
            Les paiements sont traités par Stripe. Aucune donnée bancaire
            n&apos;est stockée ou accessible sur nos serveurs.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification et de suppression de vos données personnelles. Pour
            l&apos;exercer, contactez-nous à bonjour@lespetitsbonheurs.fr.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">Cookies</h2>
          <p>
            Ce site utilise des cookies strictement nécessaires à son
            fonctionnement (panier, session) ainsi que des cookies de mesure
            d&apos;audience, sous réserve de votre consentement.
          </p>
        </div>
      </div>
    </section>
  );
}
