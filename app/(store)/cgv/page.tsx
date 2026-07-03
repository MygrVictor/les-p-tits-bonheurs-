import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGV — Les P'tits Bonheurs",
};

export default function CgvPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Informations légales
        </p>
        <h1 className="font-serif text-4xl text-ink">
          Conditions générales de vente
        </h1>
      </header>

      <div className="space-y-6 rounded-3xl bg-white p-8 shadow-soft text-sm leading-7 text-neutral-700">
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">1. Commandes</h2>
          <p>
            Toute commande passée sur le site implique l&apos;acceptation pleine
            et entière des présentes conditions générales de vente. Les prix
            sont indiqués en euros, toutes taxes comprises.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">2. Paiement</h2>
          <p>
            Le paiement est sécurisé et traité par Stripe. Aucune information
            bancaire n&apos;est stockée sur nos serveurs.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">3. Livraison</h2>
          <p>
            Les commandes sont expédiées en France sous 3 à 5 jours ouvrés après
            validation du paiement.
          </p>
        </div>
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">
            4. Droit de rétractation
          </h2>
          <p>
            Conformément à la législation en vigueur, vous disposez d&apos;un
            délai de 14 jours à compter de la réception de votre commande pour
            exercer votre droit de rétractation.
          </p>
        </div>
      </div>
    </section>
  );
}
