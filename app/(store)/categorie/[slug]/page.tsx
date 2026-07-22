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
import { prisma } from "@/lib/prisma";
import {
  getCategoryFilterConfig,
  detectGroupValue,
} from "@/lib/category-filters";
import { PRODUCT_COLORS } from "@/lib/colors";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });

  if (!category) return { title: "Catégorie introuvable" };

  return {
    title: `${category.name} — Les P'tits Bonheurs`,
    description: `Découvrez notre sélection ${category.name.toLowerCase()} : bijoux, mode et accessoires artisanaux. Livraison rapide en France et en Europe.`,
    openGraph: {
      title: `${category.name} — Les P'tits Bonheurs`,
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

export function generateStaticParams() {
  return [];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function isWithinNewWindow(createdAt: Date, days = 90): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt.getTime() >= cutoff;
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

  const category = await prisma.category.findUnique({
    where: { slug: safeParams.data.slug },
    include: {
      parent: { select: { id: true, slug: true, name: true } },
      children: { select: { id: true } },
    },
  });

  if (!category) {
    notFound();
  }

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const isColorHub = category.slug === "couleurs";
  const filterConfig = getCategoryFilterConfig(category);

  const resolvedSearch = searchParams ?? {};
  const page = Math.max(1, parseInt(String(resolvedSearch.page ?? "1"), 10));

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

  const selectedBrandsEarly = toParamArray(resolvedSearch.brand);
  const rawSelectedColorEarly =
    typeof resolvedSearch.couleur === "string"
      ? resolvedSearch.couleur
      : undefined;
  const parsedPriceMin =
    typeof resolvedSearch.prixMin === "string"
      ? Number.parseInt(resolvedSearch.prixMin, 10)
      : Number.NaN;
  const parsedPriceMax =
    typeof resolvedSearch.prixMax === "string"
      ? Number.parseInt(resolvedSearch.prixMax, 10)
      : Number.NaN;
  const selectedMinPriceEarly =
    Number.isFinite(parsedPriceMin) && parsedPriceMin >= 0
      ? parsedPriceMin
      : null;
  const selectedMaxPriceEarly =
    Number.isFinite(parsedPriceMax) && parsedPriceMax >= 0
      ? parsedPriceMax
      : null;

  const baseWhere = isColorHub
    ? { status: "ACTIVE" as const, color: { not: null } }
    : { categoryId: { in: categoryIds }, status: "ACTIVE" as const };

  const productBaseWhere = {
    ...baseWhere,
    ...(selectedBrandsEarly.length > 0
      ? { brandId: { in: selectedBrandsEarly } }
      : {}),
    ...(isColorHub && rawSelectedColorEarly
      ? { color: rawSelectedColorEarly }
      : {}),
  };

  const priceStats = await prisma.product.aggregate({
    where: productBaseWhere,
    _min: { price: true },
    _max: { price: true },
  });

  const availableMinPrice =
    typeof priceStats._min.price === "number"
      ? Math.floor(priceStats._min.price / 100)
      : null;
  const availableMaxPrice =
    typeof priceStats._max.price === "number"
      ? Math.ceil(priceStats._max.price / 100)
      : null;

  const clampedMinPrice =
    selectedMinPriceEarly !== null && availableMinPrice !== null
      ? Math.max(availableMinPrice, selectedMinPriceEarly)
      : selectedMinPriceEarly;
  const clampedMaxPrice =
    selectedMaxPriceEarly !== null && availableMaxPrice !== null
      ? Math.min(availableMaxPrice, selectedMaxPriceEarly)
      : selectedMaxPriceEarly;

  const safeSelectedMinPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.min(clampedMinPrice, clampedMaxPrice)
      : clampedMinPrice;
  const safeSelectedMaxPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.max(clampedMinPrice, clampedMaxPrice)
      : clampedMaxPrice;

  const productWhere = {
    ...productBaseWhere,
    ...(safeSelectedMinPrice !== null || safeSelectedMaxPrice !== null
      ? {
          price: {
            ...(safeSelectedMinPrice !== null
              ? { gte: safeSelectedMinPrice * 100 }
              : {}),
            ...(safeSelectedMaxPrice !== null
              ? { lte: safeSelectedMaxPrice * 100 }
              : {}),
          },
        }
      : {}),
  };

  const [rawProducts, totalProducts, rawBrands] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        salePrice: true,
        images: true,
        stock: true,
        status: true,
        isNew: true,
        tags: true,
        brandId: true,
        categoryId: true,
        color: true,
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
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where: productWhere }),
    prisma.brand.findMany({
      where: {
        products: {
          some: productWhere,
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  const products = rawProducts.map((product) => {
    const images = toStringArray(product.images);
    const tags = toStringArray(product.tags);

    return {
      id: product.slug,
      name: product.name,
      description: product.description,
      price: product.price / 100,
      salePrice: product.salePrice ? product.salePrice / 100 : null,
      brandId: product.brandId,
      categoryId: product.categoryId,
      color: product.color,
      images:
        images.length > 0
          ? images
          : [
              "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
            ],
      stock: product.stock,
      status: (product.status === "ACTIVE"
        ? "active"
        : product.status === "ARCHIVED"
          ? "inactive"
          : "new") as "active" | "inactive" | "new",
      isNew: product.isNew && isWithinNewWindow(product.createdAt, 90),
      tags,
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

  const selectedGroupValues: Record<string, string | null> = {};
  if (filterConfig) {
    for (const group of filterConfig.groups) {
      const raw = resolvedSearch[group.paramName];
      const value = typeof raw === "string" ? raw : undefined;
      selectedGroupValues[group.paramName] =
        value && group.options.some((option) => option.id === value)
          ? value
          : null;
    }
  }

  const availableColorIds = isColorHub
    ? Array.from(
        new Set(
          products.map((p) => p.color).filter((c): c is string => Boolean(c)),
        ),
      )
    : [];
  const colorOptions = PRODUCT_COLORS.filter((c) =>
    availableColorIds.includes(c.id),
  );
  const selectedColor =
    isColorHub &&
    rawSelectedColorEarly &&
    availableColorIds.includes(rawSelectedColorEarly)
      ? rawSelectedColorEarly
      : null;

  const selectedBrands = selectedBrandsEarly;
  const selectedMinPrice = safeSelectedMinPrice;
  const selectedMaxPrice = safeSelectedMaxPrice;

  const brandOptions = rawBrands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));

  const filteredProducts = products.filter((product) => {
    const effectivePrice = product.salePrice ?? product.price;

    const matchesGroups = filterConfig
      ? filterConfig.groups.every((group) => {
          const selected = selectedGroupValues[group.paramName];
          if (!selected) return true;
          return detectGroupValue(product, group) === selected;
        })
      : true;

    const matchesColor = selectedColor ? product.color === selectedColor : true;
    const matchesBrand =
      selectedBrands.length === 0
        ? true
        : selectedBrands.includes(product.brandId);
    const matchesMinPrice =
      selectedMinPrice === null ? true : effectivePrice >= selectedMinPrice;
    const matchesMaxPrice =
      selectedMaxPrice === null ? true : effectivePrice <= selectedMaxPrice;

    return (
      matchesGroups &&
      matchesColor &&
      matchesBrand &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

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
