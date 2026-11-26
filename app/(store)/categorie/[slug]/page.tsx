import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductGrid } from "@/components/store/product-grid";
import {
  CategoryFilters,
  type FilterGroup,
} from "@/components/store/category-filters";
import { productFilterSchema, slugSchema } from "@/lib/validations/catalog";
import { getCategoryFilterConfig } from "@/lib/category-filters";
import { PRODUCT_COLORS } from "@/lib/colors";
import { getCategoryListing, getCategoryName } from "@/lib/category-listing";

// Rendu à la demande (les filtres passent par l'URL), mais les requêtes
// catalogue sont mises en cache (voir lib/catalog-cache.ts).

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const name = await getCategoryName(params.slug);

  if (!name) return { title: "Catégorie introuvable" };

  return {
    title: `${name} — Les P'tits Bonheurs`,
    description: `Découvrez notre sélection ${name.toLowerCase()} : bijoux, mode et accessoires artisanaux. Livraison rapide en France et en Europe.`,
    openGraph: {
      title: `${name} — Les P'tits Bonheurs`,
      type: "website",
    },
  };
}

function toParamArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((v) => v.split(",")).map((v) => v.trim());
  }
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toPrice(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default async function CategoryPage({
  params,
  searchParams,
}: Readonly<{
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}>) {
  const safeParams = slugSchema.safeParse(params);
  if (!safeParams.success) {
    notFound();
  }

  const resolvedSearch = searchParams ?? {};
  const page = Math.max(
    1,
    parseInt(String(resolvedSearch.page ?? "1"), 10) || 1,
  );

  const filterResult = productFilterSchema.safeParse({
    category: safeParams.data.slug,
    query: typeof resolvedSearch.q === "string" ? resolvedSearch.q : undefined,
    brand:
      typeof resolvedSearch.brand === "string"
        ? resolvedSearch.brand
        : undefined,
    stone:
      typeof resolvedSearch.stone === "string"
        ? resolvedSearch.stone
        : undefined,
    page,
    sort:
      typeof resolvedSearch.sort === "string" ? resolvedSearch.sort : "newest",
  });

  const listing = await getCategoryListing({
    slug: safeParams.data.slug,
    page,
    brands: toParamArray(resolvedSearch.brand),
    color:
      typeof resolvedSearch.couleur === "string"
        ? resolvedSearch.couleur
        : null,
    minPrice: toPrice(resolvedSearch.prixMin),
    maxPrice: toPrice(resolvedSearch.prixMax),
    groups: {
      type: typeof resolvedSearch.type === "string" ? resolvedSearch.type : null,
      pieces:
        typeof resolvedSearch.pieces === "string"
          ? resolvedSearch.pieces
          : null,
    },
  });

  if (!listing) {
    notFound();
  }

  const { category, totalPages } = listing;
  const isColorHub = category.slug === "couleurs";
  const filterConfig = getCategoryFilterConfig(category);
  const filteredProducts = listing.products;
  const selectedGroupValues = listing.selectedGroupValues;
  const selectedColor = listing.selectedColor;
  const selectedBrands = toParamArray(resolvedSearch.brand);
  const selectedMinPrice = listing.selectedMinPrice;
  const selectedMaxPrice = listing.selectedMaxPrice;
  const availableMinPrice = listing.availableMinPrice;
  const availableMaxPrice = listing.availableMaxPrice;
  const brandOptions = listing.brandOptions;
  const colorOptions = PRODUCT_COLORS.filter((c) =>
    listing.availableColorIds.includes(c.id),
  );

  const filterGroups: FilterGroup[] = (filterConfig?.groups ?? []).map(
    (group) => ({
      paramName: group.paramName,
      title: group.title,
      selected: selectedGroupValues[group.paramName] ?? null,
      options: group.options.map((option) => ({
        id: option.id,
        label: option.label,
        helper: option.helper,
      })),
    }),
  );

  if (isColorHub && colorOptions.length > 0) {
    filterGroups.push({
      paramName: "couleur",
      title: "Couleur",
      selected: selectedColor,
      variant: "swatch",
      options: colorOptions.map((color) => ({
        id: color.id,
        label: color.label,
        hex: color.hex,
      })),
    });
  }

  const preservedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (key === "page") continue;
    if (typeof value === "string") preservedParams.set(key, value);
    if (Array.isArray(value) && value.length > 0) {
      preservedParams.set(key, value.join(","));
    }
  }

  const buildPageHref = (targetPage: number) => {
    const nextParams = new URLSearchParams(preservedParams.toString());
    nextParams.set("page", String(targetPage));
    return `/categorie/${category.slug}?${nextParams.toString()}`;
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Catalogue
        </p>
        <h1 className="font-serif text-4xl text-ink">{category.name}</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          {filterResult.success
            ? `Page ${filterResult.data.page} · Tri ${filterResult.data.sort}`
            : "Résultats sélectionnés avec validation stricte."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <CategoryFilters
            categoryHref={`/categorie/${category.slug}`}
            filterGroups={filterGroups}
            selectedBrands={selectedBrands}
            selectedMinPrice={selectedMinPrice}
            selectedMaxPrice={selectedMaxPrice}
            availableMinPrice={availableMinPrice}
            availableMaxPrice={availableMaxPrice}
            brandOptions={brandOptions}
          />
        </aside>

        <section className="lg:col-span-3 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
              <p className="text-sm text-neutral-500">
                Aucun produit ne correspond à ces filtres pour le moment —
                revenez bientôt, la sélection s&apos;agrandit régulièrement !
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={filteredProducts} />
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 shadow-soft">
                  <p className="text-sm text-neutral-500">
                    Page {page} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    {page > 1 ? (
                      <Link
                        href={buildPageHref(page - 1)}
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
                        href={buildPageHref(page + 1)}
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
    </div>
  );
}
