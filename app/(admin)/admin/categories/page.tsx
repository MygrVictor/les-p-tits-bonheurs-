import { prisma } from "@/lib/prisma";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(admin)/admin/actions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  const rootCategories = categories.filter((category) => !category.parentId);
  const childCategories = categories.filter((category) => category.parentId);
  const orderedCategories = [
    ...rootCategories.flatMap((rootCategory) => [
      rootCategory,
      ...childCategories.filter(
        (category) => category.parentId === rootCategory.id,
      ),
    ]),
    ...childCategories.filter(
      (category) =>
        !rootCategories.some(
          (rootCategory) => rootCategory.id === category.parentId,
        ),
    ),
  ];

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Catégories</h1>

      <form
        action={createCategory}
        className="rounded-3xl bg-white p-6 shadow-soft"
      >
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Ajouter une catégorie ou une sous-catégorie
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
          <select
            name="parentId"
            className="rounded-xl border border-neutral-200 px-3 py-2"
            defaultValue=""
          >
            <option value="">Aucune — catégorie principale</option>
            {rootCategories.map((category) => (
              <option key={category.id} value={category.id}>
                Sous-catégorie de {category.name}
              </option>
            ))}
          </select>
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
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Produits</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderedCategories.map((category) => {
              const formId = `category-form-${category.id}`;

              return (
                <tr key={category.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-ink">
                    <input
                      form={formId}
                      name="name"
                      defaultValue={category.name}
                      className={`w-full rounded-lg border border-neutral-200 px-2 py-1 ${category.parentId ? "ml-6" : ""}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <input
                      form={formId}
                      name="slug"
                      defaultValue={category.slug}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {category.parentId ? "Sous-catégorie" : "Catégorie"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <select
                      form={formId}
                      name="parentId"
                      defaultValue={category.parentId ?? ""}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1"
                    >
                      <option value="">Aucune</option>
                      {rootCategories
                        .filter(
                          (rootCategory) => rootCategory.id !== category.id,
                        )
                        .map((rootCategory) => (
                          <option key={rootCategory.id} value={rootCategory.id}>
                            {rootCategory.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {category._count.products}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <form
                        id={formId}
                        action={updateCategory.bind(null, category.id)}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                        >
                          Enregistrer
                        </button>
                      </form>
                      <form action={deleteCategory.bind(null, category.id)}>
                        <button
                          type="submit"
                          disabled={
                            category._count.products > 0 ||
                            category.children.length > 0
                          }
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
