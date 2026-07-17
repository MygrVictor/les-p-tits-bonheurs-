import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateProductStock, deleteProduct } from "@/app/(admin)/admin/actions";
import { storefrontMainMenu } from "@/lib/menu";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export const dynamic = "force-dynamic";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type AdminProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  categoryId: string;
  brand: { name: string };
  _count: { orderItems: number };
};

// Les produits sont rangés par catégorie (dans l'ordre du menu du site,
// pour rester intuitif) plutôt qu'en une seule longue liste — plus simple
// à parcourir pour l'admin. Voir lib/menu.ts pour la source de l'ordre.

function extractCategorySlug(href: string): string | null {
  const match = href.match(/^\/categorie\/([^/?]+)/);
  return match ? match[1] : null;
}

function buildMenuOrder(): {
  rootOrder: string[];
  childOrderByRoot: Record<string, string[]>;
} {
  const rootOrder: string[] = [];
  const childOrderByRoot: Record<string, string[]> = {};

  for (const item of storefrontMainMenu) {
    const rootSlug = extractCategorySlug(item.href);
    if (!rootSlug) continue; // ex. "Nouveautés" → /nouveautes (pas une catégorie)

    rootOrder.push(rootSlug);
    const childSlugs: string[] = [];
    for (const section of item.sections ?? []) {
      for (const link of section.links) {
        const slug = extractCategorySlug(link.href);
        if (slug && slug !== rootSlug && !childSlugs.includes(slug)) {
          childSlugs.push(slug);
        }
      }
    }
    childOrderByRoot[rootSlug] = childSlugs;
  }

  return { rootOrder, childOrderByRoot };
}

function sortBySlugOrder<T extends { slug: string; name: string }>(
  items: T[],
  order: string[],
): T[] {
  return [...items].sort((a, b) => {
    const indexA = order.indexOf(a.slug);
    const indexB = order.indexOf(b.slug);
    if (indexA === -1 && indexB === -1)
      return a.name.localeCompare(b.name, "fr");
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function ProductRows({ products }: Readonly<{ products: AdminProductRow[] }>) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-neutral-50 text-left text-neutral-500">
        <tr>
          <th className="px-4 py-2.5">Produit</th>
          <th className="px-4 py-2.5">Marque</th>
          <th className="px-4 py-2.5">Prix</th>
          <th className="px-4 py-2.5">Stock</th>
          <th className="px-4 py-2.5">Statut</th>
          <th className="px-4 py-2.5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const hasOrders = product._count.orderItems > 0;
          return (
            <tr key={product.id} className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-medium text-ink">
                {product.name}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {product.brand.name}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {(product.price / 100).toFixed(2)} €
              </td>
              <td className="px-4 py-2.5">
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
              <td className="px-4 py-2.5 text-neutral-600">{product.status}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/produits/${product.id}/modifier`}
                    className="text-primary hover:text-primary-hover"
                  >
                    Modifier
                  </Link>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Supprimer définitivement « ${product.name} » ? Cette action est irréversible.`}
                      disabled={hasOrders}
                      title={
                        hasOrders
                          ? "Ce produit fait partie de commandes existantes — archivez-le plutôt."
                          : undefined
                      }
                      className="text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-neutral-300"
                    >
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: Readonly<{
  searchParams?: { categorie?: string; q?: string };
}>) {
  const selectedCategorySlug = searchParams?.categorie?.trim() || null;
  const query = searchParams?.q?.trim() ?? "";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: query
        ? { name: { contains: query, mode: "insensitive" } }
        : undefined,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        categoryId: true,
        brand: { select: { name: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
    }),
  ]);

  const productsByCategoryId = new Map<string, AdminProductRow[]>();
  for (const product of products) {
    const list = productsByCategoryId.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategoryId.set(product.categoryId, list);
  }

  function countForRoot(root: AdminCategory): number {
    const own = productsByCategoryId.get(root.id)?.length ?? 0;
    const children = categories.filter((c) => c.parentId === root.id);
    return (
      own +
      children.reduce(
        (sum, child) => sum + (productsByCategoryId.get(child.id)?.length ?? 0),
        0,
      )
    );
  }

  const { rootOrder, childOrderByRoot } = buildMenuOrder();
  const rootCategories = sortBySlugOrder(
    categories.filter((c) => !c.parentId),
    rootOrder,
  );
  const visibleRootCategories = selectedCategorySlug
    ? rootCategories.filter((c) => c.slug === selectedCategorySlug)
    : rootCategories;

  const queryParam = query ? `&q=${encodeURIComponent(query)}` : "";
  const resetHref = query
    ? `/admin/produits?q=${encodeURIComponent(query)}`
    : "/admin/produits";

  const groups = visibleRootCategories
    .map((root) => {
      const ownProducts = productsByCategoryId.get(root.id) ?? [];
      const childCategories = sortBySlugOrder(
        categories.filter((c) => c.parentId === root.id),
        childOrderByRoot[root.slug] ?? [],
      );
      const childGroups = childCategories
        .map((child) => ({
          child,
          products: productsByCategoryId.get(child.id) ?? [],
        }))
        .filter((g) => g.products.length > 0);
      const total =
        ownProducts.length +
        childGroups.reduce((s, g) => s + g.products.length, 0);

      return { root, ownProducts, childGroups, total };
    })
    .filter((group) => group.total > 0);

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

      <div className="space-y-4 rounded-3xl bg-white p-5 shadow-soft">
        <form className="flex flex-wrap items-center gap-3">
          {selectedCategorySlug && (
            <input
              type="hidden"
              name="categorie"
              value={selectedCategorySlug}
            />
          )}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Rechercher un produit…"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Rechercher
          </button>
          {(query || selectedCategorySlug) && (
            <Link
              href="/admin/produits"
              className="text-xs font-medium text-neutral-400 underline hover:text-neutral-600"
            >
              Réinitialiser
            </Link>
          )}
        </form>

        <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1">
          <Link
            href={resetHref}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              !selectedCategorySlug
                ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:bg-neutral-50"
            }`}
          >
            Toutes ({products.length})
          </Link>
          {rootCategories.map((root) => {
            const count = countForRoot(root);
            const active = selectedCategorySlug === root.slug;
            return (
              <Link
                key={root.id}
                href={`/admin/produits?categorie=${root.slug}${queryParam}`}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-primary bg-primary/15 text-ink ring-1 ring-primary/20"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:bg-neutral-50"
                }`}
              >
                {root.name} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Aucun produit ne correspond à ces filtres.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ root, ownProducts, childGroups, total }) => (
            <details
              key={root.id}
              open
              className="group overflow-hidden rounded-3xl bg-white shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-xl text-ink">
                    {root.name}
                  </span>
                  <span className="rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-semibold text-blush-700">
                    {total}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>

              <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                {ownProducts.length > 0 && (
                  <div>
                    {childGroups.length > 0 && (
                      <p className="bg-blush-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blush-700">
                        Directement dans {root.name} · {ownProducts.length}
                      </p>
                    )}
                    <div className="overflow-x-auto">
                      <ProductRows products={ownProducts} />
                    </div>
                  </div>
                )}
                {childGroups.map(({ child, products: childProducts }) => (
                  <div key={child.id}>
                    <p className="bg-blush-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blush-700">
                      {child.name} · {childProducts.length}
                    </p>
                    <div className="overflow-x-auto">
                      <ProductRows products={childProducts} />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
