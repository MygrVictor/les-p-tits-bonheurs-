import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/product-grid";
import { BijouxBentoFilters } from "../../../../components/store/bijoux-bento-filters";
import { productFilterSchema, slugSchema } from "@/lib/validations/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BIJOU_TYPES = [
  "collier",
  "bracelet",
  "boucles",
  "bagues",
  "boites",
  "autres",
] as const;
const BIJOU_PRICE_RANGES = ["0-39", "40-59", "60+"] as const;

// Note : les anciens slugs de catégories (avant la réorganisation du menu,
// 2026) sont redirigés vers leur nouvel équivalent au niveau de
// next.config.mjs (redirects()), pas ici. Ça garantit un vrai HTTP 308
// (avant tout rendu), plutôt qu'un redirect() "soft" côté client qui serait
// invisible pour les crawlers et les liens déjà partagés/indexés.

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
  if (source.includes("boucles") || source.includes("oreille"))
    return "boucles";
  if (source.includes("bague")) return "bagues";
  if (
    source.includes("boîte") ||
    source.includes("boite") ||
    source.includes("écrin") ||
    source.includes("ecrin")
  )
    return "boites";
  return "autres";
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

  // « Voir tout » sur une catégorie parente (ex. Bijouterie, Jeux & DIY…)
  // agrège aussi les produits de ses sous-catégories, pas seulement les
  // siens en propre.
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  // Une des 2 « univers » de la bijouterie (Acier inoxydable / Plaqué Or),
  // ou la page Bijouterie elle-même (qui agrège les deux) : dans les deux
  // cas on affiche le filtre par type de bijou.
  const isBijouterie =
    category.slug === "bijouterie" || category.parent?.slug === "bijouterie";

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
        categoryId: { in: categoryIds },
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
            categoryId: { in: categoryIds },
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

  const filteredProducts = isBijouterie
    ? products.filter((product) => {
        const productType = getBijouType(product);
        const effectivePrice = product.salePrice ?? product.price;

        const matchesType = selectedType ? productType === selectedType : true;
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

        return matchesType && matchesBrand && matchesPrice;
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

      {isBijouterie ? (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Filtres */}
          <aside className="lg:col-span-1">
            <BijouxBentoFilters
              categoryHref={`/categorie/${category.slug}`}
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
