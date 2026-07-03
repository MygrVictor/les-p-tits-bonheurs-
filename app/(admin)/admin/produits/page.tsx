import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateProductStock } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl text-ink">Produits</h1>
        <Link
          href="/admin/produits/nouveau"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          + Nouveau produit
        </Link>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Marque</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-ink">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {product.category.name}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {product.brand.name}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {(product.price / 100).toFixed(2)} €
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateProductStock.bind(null, product.id)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="number"
                      name="stock"
                      min={0}
                      defaultValue={product.stock}
                      className="w-20 rounded-lg border border-neutral-200 px-2 py-1"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50"
                    >
                      MAJ
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-neutral-600">{product.status}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/produits/${product.id}/modifier`}
                    className="text-primary hover:text-primary-hover"
                  >
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
