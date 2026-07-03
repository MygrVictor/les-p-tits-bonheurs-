import { prisma } from "@/lib/prisma";
import { categories as defaultCategories } from "@/lib/catalog";

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  brandId: string;
  categoryId: string;
  images: string[];
  stock: number;
  status: "active" | "inactive" | "new";
  isNew: boolean;
  createdAt?: Date;
  tags: string[];
  featured?: boolean;
  variants: {
    id: string;
    productId: string;
    name: string;
    value: string;
    stock: number;
    price?: number | null;
  }[];
  stones: {
    id: string;
    productId: string;
    name: string;
    color: string;
    virtues: string;
  }[];
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function isWithinNewWindow(createdAt: Date, days = 90): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt.getTime() >= cutoff;
}

function mapDbProduct(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  brandId: string;
  categoryId: string;
  images: unknown;
  stock: number;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  isNew: boolean;
  createdAt: Date;
  tags: unknown;
  variants: {
    id: string;
    productId: string;
    name: string;
    value: string;
    stock: number;
    price: number | null;
  }[];
}): StorefrontProduct {
  const images = toStringArray(product.images);
  const tags = toStringArray(product.tags);
  const eligibleNew = product.isNew && isWithinNewWindow(product.createdAt, 90);

  return {
    id: product.slug || product.id,
    name: product.name,
    description: product.description,
    price: product.price / 100,
    salePrice: product.salePrice ? product.salePrice / 100 : null,
    brandId: product.brandId,
    categoryId: product.categoryId,
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
    stock: product.stock,
    status:
      product.status === "ACTIVE"
        ? "active"
        : product.status === "ARCHIVED"
          ? "inactive"
          : "new",
    isNew: eligibleNew,
    createdAt: product.createdAt,
    tags,
    featured: eligibleNew || product.tags?.toString().includes("featured"),
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
}

export async function getStoreCategories() {
  const dbCategories = await prisma.category.findMany({
    where: {
      slug: {
        in: defaultCategories.map((category) => category.slug),
      },
    },
    select: { id: true, name: true, slug: true },
  });

  return defaultCategories.map((category) => {
    const dbCategory = dbCategories.find(
      (entry) => entry.slug === category.slug,
    );

    return {
      id: dbCategory?.id ?? category.id,
      name: category.name,
      slug: category.slug,
    };
  });
}

export async function getFeaturedStoreProducts(
  limit = 8,
): Promise<StorefrontProduct[]> {
  const dbProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: true },
    orderBy: [{ isNew: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return dbProducts.map(mapDbProduct);
}

export async function getBentoStoreProducts(
  limit = 5,
): Promise<StorefrontProduct[]> {
  const dbProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return dbProducts
    .map(mapDbProduct)
    .sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}
