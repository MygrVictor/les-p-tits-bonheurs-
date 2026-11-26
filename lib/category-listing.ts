import { prisma } from "@/lib/prisma";
import { cachedCatalog } from "@/lib/catalog-cache";
import {
  detectGroupValue,
  getCategoryFilterConfig,
} from "@/lib/category-filters";
import type { Product } from "@/lib/catalog";

export const CATEGORY_PAGE_SIZE = 20;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

export type CategoryListingInput = {
  slug: string;
  page: number;
  brands: string[];
  /** Couleur demandée (hub "couleurs" uniquement). */
  color: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** Valeurs brutes des filtres "Type" (paramName → option id). */
  groups: Record<string, string | null>;
};

export type CategoryListingProduct = Product & { color: string | null };

export type CategoryListing = {
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; slug: string; name: string } | null;
  };
  products: CategoryListingProduct[];
  totalProducts: number;
  totalPages: number;
  availableMinPrice: number | null;
  availableMaxPrice: number | null;
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;
  selectedGroupValues: Record<string, string | null>;
  selectedColor: string | null;
  availableColorIds: string[];
  brandOptions: { id: string; name: string }[];
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function isWithinNewWindow(createdAt: Date, days = 90): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt.getTime() >= cutoff;
}

export const getCategoryName = cachedCatalog(
  "category-name",
  async (slug: string) =>
    (
      await prisma.category.findUnique({
        where: { slug },
        select: { name: true },
      })
    )?.name ?? null,
);

/**
 * Charge une page de catégorie.
 *
 * Les filtres "Type" sont déduits du nom/des tags (pas de colonne en base) :
 * ils ne peuvent pas être appliqués en SQL. On filtre donc d'abord une liste
 * LÉGÈRE (id, nom, tags, prix) de tous les produits de la catégorie, puis on
 * pagine, puis on charge le détail des seuls produits de la page. Avant, la
 * pagination SQL était faite AVANT ce filtre : pages à moitié vides et
 * totaux faux.
 */
async function loadCategoryListing(
  input: CategoryListingInput,
): Promise<CategoryListing | null> {
  const category = await prisma.category.findUnique({
    where: { slug: input.slug },
    include: {
      parent: { select: { id: true, slug: true, name: true } },
    },
  });
  if (!category) return null;

  // Tous les niveaux en dessous (ex. Bijouterie > Acier inoxydable > Doré > Bracelets).
  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true },
  });
  const categoryIds = [category.id];
  for (let i = 0; i < categoryIds.length; i++) {
    for (const c of allCategories) {
      if (c.parentId === categoryIds[i] && !categoryIds.includes(c.id)) {
        categoryIds.push(c.id);
      }
    }
  }
  const isColorHub = category.slug === "couleurs";
  const filterConfig = getCategoryFilterConfig(category);

  const baseWhere = isColorHub
    ? { status: "ACTIVE" as const, color: { not: null } }
    : { categoryId: { in: categoryIds }, status: "ACTIVE" as const };

  const brandWhere =
    input.brands.length > 0 ? { brandId: { in: input.brands } } : {};

  const availableColorIds = isColorHub
    ? (
        await prisma.product.findMany({
          where: { ...baseWhere, ...brandWhere },
          distinct: ["color"],
          select: { color: true },
        })
      )
        .map((p) => p.color)
        .filter((c): c is string => Boolean(c))
    : [];
  const selectedColor =
    isColorHub && input.color && availableColorIds.includes(input.color)
      ? input.color
      : null;

  const productBaseWhere = {
    ...baseWhere,
    ...brandWhere,
    ...(selectedColor ? { color: selectedColor } : {}),
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

  const clampedMin =
    input.minPrice !== null && availableMinPrice !== null
      ? Math.max(availableMinPrice, input.minPrice)
      : input.minPrice;
  const clampedMax =
    input.maxPrice !== null && availableMaxPrice !== null
      ? Math.min(availableMaxPrice, input.maxPrice)
      : input.maxPrice;
  const selectedMinPrice =
    clampedMin !== null && clampedMax !== null
      ? Math.min(clampedMin, clampedMax)
      : clampedMin;
  const selectedMaxPrice =
    clampedMin !== null && clampedMax !== null
      ? Math.max(clampedMin, clampedMax)
      : clampedMax;

  const productWhere = {
    ...productBaseWhere,
    ...(selectedMinPrice !== null || selectedMaxPrice !== null
      ? {
          price: {
            ...(selectedMinPrice !== null
              ? { gte: selectedMinPrice * 100 }
              : {}),
            ...(selectedMaxPrice !== null
              ? { lte: selectedMaxPrice * 100 }
              : {}),
          },
        }
      : {}),
  };

  const selectedGroupValues: Record<string, string | null> = {};
  for (const group of filterConfig?.groups ?? []) {
    const value = input.groups[group.paramName] ?? null;
    selectedGroupValues[group.paramName] =
      value && group.options.some((option) => option.id === value)
        ? value
        : null;
  }

  const [candidates, rawBrands] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      select: { id: true, name: true, tags: true, price: true, salePrice: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      where: { products: { some: productWhere } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const matchingIds = candidates
    .filter((product) => {
      const effectivePrice = (product.salePrice ?? product.price) / 100;
      const tags = toStringArray(product.tags);
      const matchesGroups = (filterConfig?.groups ?? []).every((group) => {
        const selected = selectedGroupValues[group.paramName];
        if (!selected) return true;
        return detectGroupValue({ name: product.name, tags }, group) === selected;
      });
      return (
        matchesGroups &&
        (selectedMinPrice === null || effectivePrice >= selectedMinPrice) &&
        (selectedMaxPrice === null || effectivePrice <= selectedMaxPrice)
      );
    })
    .map((product) => product.id);

  const totalProducts = matchingIds.length;
  const totalPages = Math.ceil(totalProducts / CATEGORY_PAGE_SIZE);
  const pageIds = matchingIds.slice(
    (input.page - 1) * CATEGORY_PAGE_SIZE,
    input.page * CATEGORY_PAGE_SIZE,
  );

  const rawProducts =
    pageIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: pageIds } },
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
        });

  const order = new Map(pageIds.map((id, index) => [id, index]));
  rawProducts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const products: CategoryListingProduct[] = rawProducts.map((product) => {
    const images = toStringArray(product.images);
    return {
      id: product.slug,
      name: product.name,
      description: product.description,
      price: product.price / 100,
      salePrice: product.salePrice ? product.salePrice / 100 : null,
      brandId: product.brandId,
      categoryId: product.categoryId,
      color: product.color,
      images: images.length > 0 ? images : [FALLBACK_IMAGE],
      stock: product.stock,
      status:
        product.status === "ACTIVE"
          ? "active"
          : product.status === "ARCHIVED"
            ? "inactive"
            : "new",
      isNew: product.isNew && isWithinNewWindow(product.createdAt, 90),
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

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent,
    },
    products,
    totalProducts,
    totalPages,
    availableMinPrice,
    availableMaxPrice,
    selectedMinPrice,
    selectedMaxPrice,
    selectedGroupValues,
    selectedColor,
    availableColorIds,
    brandOptions: rawBrands,
  };
}

export const getCategoryListing = cachedCatalog(
  "category-listing",
  loadCategoryListing,
);
