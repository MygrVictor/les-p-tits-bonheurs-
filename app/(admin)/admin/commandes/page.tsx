import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default async function AdminOrdersPage() {
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

      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Articles</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
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
                    <form action={updateOrderStatus.bind(null, order.id)}>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                        onChange={(event) =>
                          event.currentTarget.form?.requestSubmit()
                        }
                      >
                        <option value="PENDING">En attente</option>
                        <option value="CONFIRMED">Payée / confirmée</option>
                        <option value="SHIPPED">Expédiée</option>
                        <option value="DELIVERED">Livrée</option>
                        <option value="CANCELLED">Annulée</option>
                      </select>
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
