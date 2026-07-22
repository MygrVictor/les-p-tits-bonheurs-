import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function formatCurrency(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page ?? "1", 10));

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
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
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl text-ink">Clients</h1>
        <span className="rounded-full bg-blush-100 px-3 py-1 text-sm font-semibold text-blush-700">
          {total} au total
        </span>
      </div>

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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 shadow-soft">
          <p className="text-sm text-neutral-500">
            {total} client{total > 1 ? "s" : ""} · page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/clients?page=${page - 1}`}
                className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
              >
                <ChevronLeft size={15} />
                Précédente
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-xl border border-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-300">
                <ChevronLeft size={15} />
                Précédente
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={`/admin/clients?page=${page + 1}`}
                className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
              >
                Suivante
                <ChevronRight size={15} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-xl border border-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-300">
                Suivante
                <ChevronRight size={15} />
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
