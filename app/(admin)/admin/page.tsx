import { getAdminDashboardData } from "@/lib/backoffice/dashboard";

function formatCurrency(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Back-office
        </p>
        <h1 className="font-serif text-4xl text-ink">Dashboard</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Produits total"
          value={String(data.totals.totalProducts)}
        />
        <Metric
          title="Produits actifs"
          value={String(data.totals.activeProducts)}
        />
        <Metric
          title="Ruptures"
          value={String(data.totals.outOfStockProducts)}
        />
        <Metric
          title="Stock faible"
          value={String(data.lowStockProducts.length)}
        />

        <Metric title="Commandes" value={String(data.totals.totalOrders)} />
        <Metric title="Clients" value={String(data.totals.totalClients)} />
        <Metric title="Marques" value={String(data.totals.totalBrands)} />
        <Metric
          title="Catégories"
          value={String(data.totals.totalCategories)}
        />

        <Metric
          title="Fournisseurs"
          value={String(data.totals.totalSuppliers)}
        />
        <Metric
          title="CA total"
          value={formatCurrency(data.totals.totalRevenue)}
        />
        <Metric
          title="CA du mois"
          value={formatCurrency(data.totals.monthlyRevenue)}
        />
        <Metric
          title="Panier moyen"
          value={formatCurrency(data.totals.averageCart)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Dernières commandes
          </h2>
          <div className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune commande.</p>
            ) : (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-neutral-500">{order.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-neutral-500">{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-ink">Top ventes</h2>
          <div className="space-y-2">
            {data.topSelling.length === 0 ? (
              <p className="text-sm text-neutral-500">Pas encore de ventes.</p>
            ) : (
              data.topSelling.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
                >
                  <p className="truncate text-ink">{item.productName}</p>
                  <p className="font-semibold text-neutral-700">
                    {item.quantity}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Derniers produits
          </h2>
          <div className="space-y-2">
            {data.recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
              >
                <p className="truncate text-ink">{product.name}</p>
                <p className="font-semibold text-neutral-700">
                  Stock {product.stock}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Alertes stock faible
          </h2>
          <div className="space-y-2">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune alerte.</p>
            ) : (
              data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
                >
                  <p className="text-ink">{product.name}</p>
                  <p className="font-semibold text-rose-600">{product.stock}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function Metric({ title, value }: Readonly<{ title: string; value: string }>) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-soft">
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </article>
  );
}
