import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/app/(admin)/admin/actions";
import { CARRIERS } from "@/lib/carriers";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ emailStatus?: string; order?: string }>;
}) {
  const params = await searchParams;
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Commandes</h1>

      {params?.emailStatus === "sent" && (
        <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            Email de suivi envoyé avec succès pour la commande #{params.order}.
          </span>
        </div>
      )}
      {params?.emailStatus === "failed" && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircle size={18} className="shrink-0" />
          <span>
            Échec de l&apos;envoi de l&apos;email pour la commande #
            {params.order} (le suivi a bien été enregistré). Vérifiez la
            configuration Resend (clé API, domaine vérifié) ou consultez les
            logs du serveur pour le détail de l&apos;erreur.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut &amp; suivi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const quantity = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <tr key={order.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-ink">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {order.user.email}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{quantity}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={updateOrderStatus.bind(null, order.id)}
                      className="flex min-w-[220px] flex-col gap-1.5"
                    >
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                      >
                        <option value="PENDING">En attente</option>
                        <option value="CONFIRMED">Payée / confirmée</option>
                        <option value="SHIPPED">Expédiée</option>
                        <option value="DELIVERED">Livrée</option>
                        <option value="CANCELLED">Annulée</option>
                      </select>
                      <div className="flex gap-1.5">
                        <select
                          name="carrier"
                          defaultValue={order.carrier ?? ""}
                          className="w-1/2 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                        >
                          <option value="">Transporteur…</option>
                          {CARRIERS.map((carrier) => (
                            <option key={carrier.id} value={carrier.id}>
                              {carrier.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          name="trackingNumber"
                          defaultValue={order.trackingNumber ?? ""}
                          placeholder="N° de suivi"
                          className="w-1/2 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover"
                      >
                        Enregistrer
                      </button>
                      <p className="text-[11px] text-neutral-400">
                        Renseigner un n° de suivi envoie un email automatique au
                        client. Un message apparaîtra en haut de page pour
                        confirmer l&apos;envoi (ou signaler un échec).
                      </p>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
