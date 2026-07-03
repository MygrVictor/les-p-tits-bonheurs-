import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ProductGrid } from "@/components/store/product-grid";
import { BijouxBentoFilters } from "../../../../components/store/bijoux-bento-filters";
import { productFilterSchema, slugSchema } from "@/lib/validations/catalog";
import { prisma } from "@/lib/prisma";

export const revalidate = 900;

const BIJOU_MATERIALS = ["acier-inox", "plaque-or"] as const;
const BIJOU_TYPES = ["collier", "bracelet", "boucles", "autres"] as const;
const BIJOU_PRICE_RANGES = ["0-39", "40-59", "60+"] as const;

const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "mode-et-accessoires": "lifestyle",
  "sac-et-petite-maroquinerie": "lifestyle",
};

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

function getBijouType(product: { name: string; tags: string[] }) {
  const fromName = product.name.toLowerCase();
  const fromTags = product.tags.join(" ").toLowerCase();
  const source = `${fromName} ${fromTags}`;

  if (source.includes("collier")) return "collier";
  if (source.includes("bracelet")) return "bracelet";
  if (source.includes("boucles") || source.includes("oreilles"))
    return "boucles";
  return "autres";
}

function getBijouMaterials(product: {
  description: string;
  tags: string[];
  variants: { value: string }[];
}) {
  const source =
    `${product.description} ${product.tags.join(" ")} ${product.variants
      .map((v) => v.value)
      .join(" ")}`.toLowerCase();
  const materials = new Set<(typeof BIJOU_MATERIALS)[number]>();

  if (source.includes("acier") || source.includes("inox")) {
    materials.add("acier-inox");
  }

  if (
    source.includes("plaqué") ||
    source.includes("plaque") ||
    source.includes("doré") ||
    source.includes("doree") ||
    source.includes("gold")
  ) {
    materials.add("plaque-or");
  }

  return materials;
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

  const redirectedSlug = LEGACY_CATEGORY_REDIRECTS[safeParams.data.slug];
  if (redirectedSlug) {
    redirect(`/categorie/${redirectedSlug}`);
  }

  const category = await prisma.category.findUnique({
    where: { slug: safeParams.data.slug },
  });

  if (!category) {
    notFound();
  }

  const resolvedSearch = searchParams ?? {};
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
    page: typeof resolvedSearch.page === "string" ? resolvedSearch.page : 1,
    sort:
      typeof resolvedSearch.sort === "string" ? resolvedSearch.sort : "newest",
  });

  const [rawProducts, rawBrands] = await Promise.all([
    prisma.product.findMany({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
      },
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      where: {
        products: {
          some: {
            categoryId: category.id,
            status: "ACTIVE",
          },
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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
  const selectedMaterials = toParamArray(resolvedSearch.matiere).filter(
    (value) =>
      BIJOU_MATERIALS.includes(value as (typeof BIJOU_MATERIALS)[number]),
  ) as (typeof BIJOU_MATERIALS)[number][];
  const selectedType =
    typeof resolvedSearch.type === "string" &&
    BIJOU_TYPES.includes(resolvedSearch.type as (typeof BIJOU_TYPES)[number])
      ? (resolvedSearch.type as (typeof BIJOU_TYPES)[number])
      : null;
  const selectedBrands = toParamArray(resolvedSearch.brand);
  const selectedPrice =
    typeof resolvedSearch.prix === "string" &&
    BIJOU_PRICE_RANGES.includes(
      resolvedSearch.prix as (typeof BIJOU_PRICE_RANGES)[number],
    )
      ? (resolvedSearch.prix as (typeof BIJOU_PRICE_RANGES)[number])
      : null;

  const bijouxBrandOptions = rawBrands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));

  const filteredProducts =
    safeParams.data.slug === "bijoux"
      ? products.filter((product) => {
          const productType = getBijouType(product);
          const productMaterials = getBijouMaterials(product);
          const effectivePrice = product.salePrice ?? product.price;

          const matchesType = selectedType
            ? productType === selectedType
            : true;
          const matchesMaterial =
            selectedMaterials.length === 0
              ? true
              : selectedMaterials.some((material) =>
                  productMaterials.has(material),
                );
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

          return matchesType && matchesMaterial && matchesBrand && matchesPrice;
        })
      : products;

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

      {safeParams.data.slug === "bijoux" ? (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Filtres */}
          <aside className="lg:col-span-1">
            <BijouxBentoFilters
              selectedMaterials={selectedMaterials}
              selectedType={selectedType}
              selectedBrands={selectedBrands}
              selectedPrice={selectedPrice}
              brandOptions={bijouxBrandOptions}
            />
          </aside>

          {/* Produits */}
          <section className="lg:col-span-3">
            <ProductGrid products={filteredProducts} />
          </section>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
}
