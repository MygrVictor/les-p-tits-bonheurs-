import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
  PRICE_RANGE_IDS,
  type PriceRange,
} from "@/lib/category-filters";
import { PRODUCT_COLORS } from "@/lib/colors";

export const dynamic = "force-dynamic";

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

// Note : les anciens slugs de catégories (avant la réorganisation du menu,
// 2026) sont redirigés vers leur nouvel équivalent au niveau de
// next.config.mjs (redirects()), pas ici. Ça garantit un vrai HTTP 308
// (avant tout rendu), plutôt qu'un redirect() "soft" côté client qui serait
// invisible pour les crawlers et les liens déjà partagés/indexés.

// Les filtres "basiques" (Type/Format + Marque + Prix) sont configurés par
// catégorie dans lib/category-filters.ts — voir getCategoryFilterConfig.
// Marque et Prix s'appliquent eux automatiquement à toutes les catégories.

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

  // « Voir tout » sur une catégorie parente (ex. Bijouterie, Jeux & DIY…)
  // agrège aussi les produits de ses sous-catégories, pas seulement les
  // siens en propre.
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  // « Acheter par couleur » n'est pas une vraie catégorie de produits (un
  // produit ne peut avoir qu'une seule categoryId, qui reste toujours sa
  // vraie famille) : c'est une vue transverse, comme « Nouveautés », basée
  // sur l'attribut optionnel `color` du produit (voir lib/colors.ts).
  const isColorHub = category.slug === "couleurs";

  // Filtre(s) "Type" (ou "Nombre de pièces") propres à cette famille de
  // produits, s'il y en a — voir lib/category-filters.ts. `null` quand la
  // catégorie n'a pas de vocabulaire homogène (elle garde quand même les
  // filtres Marque + Prix, communs à toutes les catégories).
  const filterConfig = getCategoryFilterConfig(category);

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

  // --- Filtres poussés côté DB pour réduire les données chargées ---
  const selectedBrandsEarly = toParamArray(resolvedSearch.brand);
  const selectedPriceEarly: PriceRange | null =
    typeof resolvedSearch.prix === "string" &&
    PRICE_RANGE_IDS.includes(resolvedSearch.prix as PriceRange)
      ? (resolvedSearch.prix as PriceRange)
      : null;
  const rawSelectedColorEarly =
    typeof resolvedSearch.couleur === "string"
      ? resolvedSearch.couleur
      : undefined;

  const priceWhere =
    selectedPriceEarly === "0-39"
      ? { price: { lte: 3900 } }
      : selectedPriceEarly === "40-59"
        ? { price: { gte: 4000, lte: 5900 } }
        : selectedPriceEarly === "60+"
          ? { price: { gte: 6000 } }
          : {};

  const baseWhere = isColorHub
    ? { status: "ACTIVE" as const, color: { not: null } }
    : { categoryId: { in: categoryIds }, status: "ACTIVE" as const };

  const productWhere = {
    ...baseWhere,
    ...(selectedBrandsEarly.length > 0
      ? { brandId: { in: selectedBrandsEarly } }
      : {}),
    ...(isColorHub && rawSelectedColorEarly
      ? { color: rawSelectedColorEarly }
      : {}),
    ...priceWhere,
  };

  const [rawProducts, rawBrands] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300, // sécurité : jamais plus de 300 produits chargés en mémoire
    }),
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

  // Valeur sélectionnée pour chaque groupe de filtre "Type" (ex. ?type=,
  // ?pieces=), validée contre les options connues de la config de cette
  // catégorie.
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

  // Filtre « Couleur » (uniquement sur /categorie/couleurs) : on ne
  // propose que les couleurs réellement présentes parmi les produits
  // trouvés, pour éviter des pastilles qui mèneraient vers une liste vide.
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
  const selectedPrice = selectedPriceEarly;

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
    const matchesPrice =
      selectedPrice === null
        ? true
        : selectedPrice === "0-39"
          ? effectivePrice <= 39
          : selectedPrice === "40-59"
            ? effectivePrice >= 40 && effectivePrice <= 59
            : effectivePrice >= 60;

    return matchesGroups && matchesColor && matchesBrand && matchesPrice;
  });

  // Groupes "Type" au format attendu par <CategoryFilters> (options
  // simplifiées + valeur sélectionnée intégrée dans chaque groupe), plus
  // le groupe "Couleur" (pastilles) quand on est sur la vue transverse.
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
        {/* Sidebar Filtres — Type (si applicable) + Marques + Prix */}
        <aside className="lg:col-span-1">
          <CategoryFilters
            categoryHref={`/categorie/${category.slug}`}
            filterGroups={filterGroups}
            selectedBrands={selectedBrands}
            selectedPrice={selectedPrice}
            brandOptions={brandOptions}
          />
        </aside>

        {/* Produits */}
        <section className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
              <p className="text-sm text-neutral-500">
                Aucun produit ne correspond à ces filtres pour le moment —
                revenez bientôt, la sélection s&apos;agrandit régulièrement !
              </p>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </section>
      </div>
    </div>
  );
}
