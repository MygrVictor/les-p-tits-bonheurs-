import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/product-grid";
import { CategoryFilters } from "@/components/store/category-filters";
import { PRICE_RANGE_IDS, type PriceRange } from "@/lib/category-filters";

export const metadata: Metadata = {
  title: "Recherche — Les P'tits Bonheurs",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toParamArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; brand?: string; prix?: string }>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const selectedBrands = toParamArray(params?.brand);
  const selectedPrice: PriceRange | null =
    params?.prix && PRICE_RANGE_IDS.includes(params.prix as PriceRange)
      ? (params.prix as PriceRange)
      : null;

  const dbProducts =
    query.length >= 2
      ? await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
            ],
          },
          include: { variants: true },
          orderBy: { createdAt: "desc" },
          take: 60,
        })
      : [];

  // Les marques proposées dans le filtre ne portent que sur les produits
  // qui correspondent déjà à la recherche (pas toutes les marques du site).
  const brandIds = Array.from(new Set(dbProducts.map((p) => p.brandId)));
  const rawBrands =
    brandIds.length > 0
      ? await prisma.brand.findMany({
          where: { id: { in: brandIds } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [];
  const brandOptions = rawBrands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));

  const allProducts = dbProducts.map((product) => {
    const images = toStringArray(product.images);
    return {
      id: product.slug,
      name: product.name,
      description: product.description,
      price: product.price / 100,
      salePrice: product.salePrice ? product.salePrice / 100 : null,
      brandId: product.brandId,
      categoryId: product.categoryId,
      images: images.length > 0 ? images : [FALLBACK_IMAGE],
      stock: product.stock,
      status: (product.status === "ACTIVE"
        ? "active"
        : product.status === "ARCHIVED"
          ? "inactive"
          : "new") as "active" | "inactive" | "new",
      isNew: product.isNew,
      tags: toStringArray(product.tags),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        value: variant.value,
        stock: variant.stock,
        price: variant.price ? variant.price / 100 : null,
      })),
      stones: [],
    };
  });

  const products = allProducts.filter((product) => {
    const effectivePrice = product.salePrice ?? product.price;
    const matchesBrand =
      selectedBrands.length === 0
        ? true
        : selectedBrands.includes(product.brandId);
    const matchesPrice =
      selectedPrice === null
        ? true
        : selectedPrice === "0-39"
          ? effectivePrice <= 39
          : selectedPrice === "40-59"
            ? effectivePrice >= 40 && effectivePrice <= 59
            : effectivePrice >= 60;
    return matchesBrand && matchesPrice;
  });

  // Garde `?q=` dans l'URL de base des filtres, pour ne pas perdre la
  // recherche en cours quand on clique une marque ou un prix.
  const searchHref = `/recherche?q=${encodeURIComponent(query)}`;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Recherche
        </p>
        <h1 className="font-serif text-4xl text-ink">
          {query ? `Résultats pour « ${query} »` : "Rechercher un produit"}
        </h1>
        {query.length >= 2 && (
          <p className="text-sm text-neutral-500">
            {products.length} résultat{products.length > 1 ? "s" : ""}
          </p>
        )}
      </header>

      {query.length > 0 && query.length < 2 ? (
        <p className="text-sm text-neutral-500">
          Merci de saisir au moins 2 caractères.
        </p>
      ) : query.length >= 2 && dbProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Aucun produit ne correspond à votre recherche « {query} ».
          </p>
        </div>
      ) : query.length >= 2 ? (
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <CategoryFilters
              categoryHref={searchHref}
              filterGroups={[]}
              selectedBrands={selectedBrands}
              selectedPrice={selectedPrice}
              brandOptions={brandOptions}
            />
          </aside>
          <section className="lg:col-span-3">
            {products.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
                <p className="text-sm text-neutral-500">
                  Aucun produit ne correspond à ces filtres.
                </p>
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Utilisez la barre de recherche en haut de la page pour trouver un
          produit.
        </p>
      )}
    </section>
  );
}
