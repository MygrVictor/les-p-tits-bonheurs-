import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/(admin)/admin/actions";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const rootCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => category.parentId);
  const selectedRootCategoryId =
    product.category.parentId ?? product.categoryId;
  const selectedSubCategoryId = product.category.parentId
    ? product.categoryId
    : "";

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Modifier produit</h1>

      <form
        action={updateProduct.bind(null, product.id)}
        className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">Nom</label>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Prix (€)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            name="price"
            required
            defaultValue={(product.price / 100).toFixed(2)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Stock</label>
          <input
            type="number"
            min={0}
            name="stock"
            required
            defaultValue={product.stock}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Statut</label>
          <select
            name="status"
            defaultValue={product.status}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="DRAFT">Brouillon</option>
            <option value="ACTIVE">Actif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Nouveauté</label>
          <select
            name="isNew"
            defaultValue={String(product.isNew)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Catégorie</label>
          <select
            name="categoryId"
            required
            defaultValue={selectedRootCategoryId}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            {rootCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Sous-catégorie</label>
          <select
            name="subCategoryId"
            defaultValue={selectedSubCategoryId}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="">Aucune</option>
            {subCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Marque</label>
          <select
            name="brandId"
            required
            defaultValue={product.brandId}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={product.description}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  );
}
