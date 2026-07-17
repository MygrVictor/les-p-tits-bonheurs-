import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct, deleteProduct } from "@/app/(admin)/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PRODUCT_COLORS } from "@/lib/colors";
import { SafeImage } from "@/components/ui/image";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string | string[] };
}) {
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const error =
    typeof searchParams?.error === "string"
      ? searchParams.error
      : Array.isArray(searchParams?.error)
        ? searchParams.error[0]
        : null;
  const hasOrders = product._count.orderItems > 0;

  const rootCategories = categories.filter((category) => !category.parentId);
  const subCategories = categories.filter((category) => category.parentId);
  const selectedRootCategoryId =
    product.category.parentId ?? product.categoryId;
  const selectedSubCategoryId = product.category.parentId
    ? product.categoryId
    : "";
  const currentImages = toStringArray(product.images);

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl text-ink">Modifier produit</h1>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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
          <label className="text-sm text-neutral-600">
            Couleur (optionnel)
          </label>
          <select
            name="color"
            defaultValue={product.color ?? ""}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="">Aucune</option>
            {PRODUCT_COLORS.map((color) => (
              <option key={color.id} value={color.id}>
                {color.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Utilisée par la catégorie « Acheter par couleur ».
          </p>
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
          <label className="text-sm text-neutral-600">
            Photos ({currentImages.length}/3)
          </label>
          {currentImages.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-3">
              {currentImages.map((url, index) => (
                <label
                  key={url}
                  className="group relative block overflow-hidden rounded-xl border border-neutral-200"
                >
                  <input
                    type="checkbox"
                    name="keepImage"
                    value={url}
                    defaultChecked
                    className="absolute right-2 top-2 z-10 h-4 w-4 accent-primary"
                  />
                  <div className="relative aspect-square bg-neutral-50">
                    <SafeImage
                      src={url}
                      alt={`Photo ${index + 1}`}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-neutral-400">
              Aucune photo pour ce produit actuellement.
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Décoche une photo pour la supprimer à l&apos;enregistrement.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">
            Ajouter des photos (upload)
          </label>
          <input
            type="file"
            name="newImagesFiles"
            accept="image/*"
            multiple
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Maximum 3 photos au total (existantes conservées + nouvelles). Les
            photos en trop seront ignorées.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-neutral-600">
            Ajouter des photos (URLs, optionnel)
          </label>
          <textarea
            name="newImages"
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
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

      <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6">
        <h2 className="font-serif text-lg text-ink">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {hasOrders
            ? "Ce produit fait partie de commandes existantes : la suppression définitive est bloquée pour préserver l'historique des commandes. Archivez-le (statut « Archivé ») pour le retirer de la boutique."
            : "La suppression est définitive et irréversible : les images, la description et les variantes de ce produit seront perdues."}
        </p>
        <form action={deleteProduct.bind(null, product.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`Supprimer définitivement « ${product.name} » ? Cette action est irréversible.`}
            disabled={hasOrders}
            className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300 disabled:hover:bg-white"
          >
            Supprimer ce produit
          </ConfirmSubmitButton>
        </form>
      </div>
    </section>
  );
}
