import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      orders: {
        select: {
          total: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Clients</h1>

      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Total dépensé</th>
              <th className="px-4 py-3">Dernière commande</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const orderCount = client.orders.length;
              const totalSpent = client.orders.reduce(
                (sum, order) => sum + order.total,
                0,
              );
              const lastOrder =
                client.orders.length > 0
                  ? [...client.orders].sort(
                      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                    )[0]
                  : null;

              return (
                <tr key={client.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-ink">{client.email}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{orderCount}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatCurrency(totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {lastOrder
                      ? new Date(lastOrder.createdAt).toLocaleDateString(
                          "fr-FR",
                        )
                      : "—"}
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
