import { prisma } from "@/lib/prisma";
import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "@/app/(admin)/admin/actions";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Marques</h1>

      <form
        action={createBrand}
        className="rounded-3xl bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Ajouter une marque
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Nom"
            className="rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            name="slug"
            placeholder="Slug (optionnel)"
            className="rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            name="logo"
            placeholder="URL logo (optionnel)"
            className="rounded-xl border border-neutral-200 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover"
          >
            Ajouter
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Produits</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => {
              const formId = `brand-form-${brand.id}`;

              return (
                <tr key={brand.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-ink">
                    <input
                      form={formId}
                      name="name"
                      defaultValue={brand.name}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <input
                      form={formId}
                      name="slug"
                      defaultValue={brand.slug}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <input
                      form={formId}
                      name="logo"
                      defaultValue={brand.logo ?? ""}
                      placeholder="URL logo"
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {brand._count.products}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <form
                        id={formId}
                        action={updateBrand.bind(null, brand.id)}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                        >
                          Enregistrer
                        </button>
                      </form>
                      <form action={deleteBrand.bind(null, brand.id)}>
                        <button
                          type="submit"
                          disabled={brand._count.products > 0}
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
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
