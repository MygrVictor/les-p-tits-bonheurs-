import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/product-grid";
import { CategoryFilters } from "@/components/store/category-filters";

export const metadata: Metadata = {
  title: "Recherche — Les P'tits Bonheurs",
};

const SEARCH_PAGE_SIZE = 20;
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
  searchParams?: Promise<{
    q?: string;
    brand?: string;
    prixMin?: string;
    prixMax?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const page = Math.max(1, parseInt(params?.page ?? "1", 10));
  const selectedBrands = toParamArray(params?.brand);
  const parsedPriceMin =
    typeof params?.prixMin === "string"
      ? Number.parseInt(params.prixMin, 10)
      : Number.NaN;
  const parsedPriceMax =
    typeof params?.prixMax === "string"
      ? Number.parseInt(params.prixMax, 10)
      : Number.NaN;
  const selectedMinPriceRaw =
    Number.isFinite(parsedPriceMin) && parsedPriceMin >= 0
      ? parsedPriceMin
      : null;
  const selectedMaxPrice =
    Number.isFinite(parsedPriceMax) && parsedPriceMax >= 0
      ? parsedPriceMax
      : null;

  const baseSearchWhere =
    query.length >= 2
      ? {
          status: "ACTIVE" as const,
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            {
              description: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
          ...(selectedBrands.length > 0
            ? { brandId: { in: selectedBrands } }
            : {}),
        }
      : null;

  const priceStats = baseSearchWhere
    ? await prisma.product.aggregate({
        where: baseSearchWhere,
        _min: { price: true },
        _max: { price: true },
      })
    : null;

  const availableMinPrice =
    priceStats && typeof priceStats._min.price === "number"
      ? Math.floor(priceStats._min.price / 100)
      : null;
  const availableMaxPrice =
    priceStats && typeof priceStats._max.price === "number"
      ? Math.ceil(priceStats._max.price / 100)
      : null;

  const clampedMinPrice =
    selectedMinPriceRaw !== null && availableMinPrice !== null
      ? Math.max(availableMinPrice, selectedMinPriceRaw)
      : selectedMinPriceRaw;
  const clampedMaxPrice =
    selectedMaxPrice !== null && availableMaxPrice !== null
      ? Math.min(availableMaxPrice, selectedMaxPrice)
      : selectedMaxPrice;

  const selectedMinPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.min(clampedMinPrice, clampedMaxPrice)
      : clampedMinPrice;
  const safeSelectedMaxPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.max(clampedMinPrice, clampedMaxPrice)
      : clampedMaxPrice;

  const searchWhere =
    baseSearchWhere &&
    (selectedMinPrice !== null || safeSelectedMaxPrice !== null)
      ? {
          ...baseSearchWhere,
          price: {
            ...(selectedMinPrice !== null
              ? { gte: selectedMinPrice * 100 }
              : {}),
            ...(safeSelectedMaxPrice !== null
              ? { lte: safeSelectedMaxPrice * 100 }
              : {}),
          },
        }
      : baseSearchWhere;

  const [dbProducts, totalProducts] =
    query.length >= 2
      ? await Promise.all([
          prisma.product.findMany({
            where: searchWhere ?? undefined,
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              price: true,
              salePrice: true,
              brandId: true,
              categoryId: true,
              images: true,
              stock: true,
              status: true,
              isNew: true,
              tags: true,
              createdAt: true,
              variants: {
                select: {
                  id: true,
                  productId: true,
                  name: true,
                  value: true,
                  stock: true,
                  price: true,
                },
                take: 3,
              },
            },
            orderBy: { createdAt: "desc" },
            take: SEARCH_PAGE_SIZE,
            skip: (page - 1) * SEARCH_PAGE_SIZE,
          }),
          prisma.product.count({
            where: searchWhere ?? undefined,
          }),
        ])
      : [[], 0];

  const totalPages = Math.ceil(totalProducts / SEARCH_PAGE_SIZE);

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

  const products = allProducts;

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
            {totalProducts} résultat{totalProducts > 1 ? "s" : ""} (page {page}{" "}
            / {totalPages})
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
              selectedMinPrice={selectedMinPrice}
              selectedMaxPrice={safeSelectedMaxPrice}
              availableMinPrice={availableMinPrice}
              availableMaxPrice={availableMaxPrice}
              brandOptions={brandOptions}
            />
          </aside>
          <section className="lg:col-span-3 space-y-6">
            {products.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
                <p className="text-sm text-neutral-500">
                  Aucun produit ne correspond à ces filtres.
                </p>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 shadow-soft">
                    <p className="text-sm text-neutral-500">
                      Page {page} / {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      {page > 1 ? (
                        <Link
                          href={`${searchHref}&page=${page - 1}`}
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
                          href={`${searchHref}&page=${page + 1}`}
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
              </>
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
