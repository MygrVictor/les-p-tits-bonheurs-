import Link from "next/link";
import { CheckCircle2, XCircle, PackageSearch } from "lucide-react";
import { finalizeCheckoutSession } from "@/lib/checkout";
import { ClearCartOnMount } from "@/components/store/clear-cart-on-mount";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const result = await finalizeCheckoutSession(params?.session_id);

  if (result.status === "invalid") {
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 shadow-soft">
          <XCircle size={44} className="text-rose-400" />
          <h1 className="font-serif text-3xl text-ink">Commande introuvable</h1>
          <p className="text-sm text-neutral-500">
            Nous n&apos;avons pas pu retrouver votre commande. Si vous venez de
            payer, contactez-nous en indiquant votre email.
          </p>
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </section>
    );
  }

  if (result.status === "unpaid") {
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 shadow-soft">
          <PackageSearch size={44} className="text-amber-400" />
          <h1 className="font-serif text-3xl text-ink">Paiement en attente</h1>
          <p className="text-sm text-neutral-500">
            Votre paiement n&apos;a pas encore été confirmé. Si le problème
            persiste, contactez-nous.
          </p>
          <Link
            href="/checkout"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Retourner au paiement
          </Link>
        </div>
      </section>
    );
  }

  const { order } = result;

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <ClearCartOnMount />
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-soft">
        <CheckCircle2 size={48} className="text-green-500" />
        <h1 className="font-serif text-4xl text-ink">Commande confirmée</h1>
        <p className="text-neutral-600">
          Merci ! Votre paiement Stripe (mode test) a bien été pris en compte.
          Un email de confirmation a été envoyé à {order.email}.
        </p>
        <p className="text-sm text-neutral-400">
          Commande #{order.id.slice(-6).toUpperCase()} —{" "}
          {new Date(order.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="font-serif text-xl text-ink">Récapitulatif</h2>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li
              key={`${item.productName}-${index}`}
              className="flex items-center justify-between text-sm text-neutral-600"
            >
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span className="font-semibold text-ink">
                {((item.price * item.quantity) / 100).toFixed(2)} €
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-base font-semibold text-ink">
          <span>Total</span>
          <span>{(order.total / 100).toFixed(2)} €</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/compte?vue=commandes"
          className="flex-1 rounded-full bg-ink py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          Voir mes commandes
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-full border border-ink/15 bg-white py-3 text-center text-sm font-semibold text-ink transition hover:bg-blush-50"
        >
          Continuer mes achats
        </Link>
      </div>
    </section>
  );
}
