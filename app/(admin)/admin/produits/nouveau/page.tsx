import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/(admin)/admin/actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams?: { error?: string | string[] };
}) {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  const rootCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => category.parentId);
  const error =
    typeof searchParams?.error === "string"
      ? searchParams.error
      : Array.isArray(searchParams?.error)
        ? searchParams.error[0]
        : null;

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Nouveau produit</h1>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        action={createProduct}
        className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">Nom</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Slug (optionnel)</label>
          <input
            name="slug"
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
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Stock</label>
          <input
            type="number"
            min={0}
            name="stock"
            defaultValue={0}
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600">Statut</label>
          <select
            name="status"
            defaultValue="ACTIVE"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="DRAFT">Brouillon</option>
            <option value="ACTIVE">Actif</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Catégorie</label>
          <select
            name="categoryId"
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="">Choisir une catégorie</option>
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
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            defaultValue=""
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
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-neutral-600">Nouveauté</label>
          <select
            name="isNew"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="false">Non</option>
            <option value="true">Oui</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">Images (upload)</label>
          <input
            type="file"
            name="imagesFiles"
            accept="image/*"
            multiple
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Tu peux sélectionner plusieurs images (Cloudinary si configuré,
            sinon stockage local du serveur).
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">
            Images (URLs, optionnel, séparées par virgule ou ligne)
          </label>
          <textarea
            name="images"
            rows={3}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">
            Tags (séparés par virgule)
          </label>
          <input
            name="tags"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover"
          >
            Créer le produit
          </button>
        </div>
      </form>
    </section>
  );
}
