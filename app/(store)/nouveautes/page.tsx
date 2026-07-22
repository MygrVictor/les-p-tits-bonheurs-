import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SafeImage } from "@/components/ui/image";
import { QuickAddToCart } from "@/components/store/quick-add-to-cart";
import { CategoryFilters } from "@/components/store/category-filters";
import type { Product } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouveautés — Les P'tits Bonheurs",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
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

export default async function NouveautesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const resolvedSearch = searchParams ?? {};
  const selectedBrands = toParamArray(resolvedSearch.brand);

  const parsedPriceMin =
    typeof resolvedSearch.prixMin === "string"
      ? Number.parseInt(resolvedSearch.prixMin, 10)
      : Number.NaN;
  const parsedPriceMax =
    typeof resolvedSearch.prixMax === "string"
      ? Number.parseInt(resolvedSearch.prixMax, 10)
      : Number.NaN;

  const selectedMinPriceRaw =
    Number.isFinite(parsedPriceMin) && parsedPriceMin >= 0
      ? parsedPriceMin
      : null;
  const selectedMaxPriceRaw =
    Number.isFinite(parsedPriceMax) && parsedPriceMax >= 0
      ? parsedPriceMax
      : null;

  const productBaseWhere = {
    status: "ACTIVE" as const,
    isNew: true,
    ...(selectedBrands.length > 0 ? { brandId: { in: selectedBrands } } : {}),
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
    selectedMinPriceRaw !== null && availableMinPrice !== null
      ? Math.max(availableMinPrice, selectedMinPriceRaw)
      : selectedMinPriceRaw;
  const clampedMaxPrice =
    selectedMaxPriceRaw !== null && availableMaxPrice !== null
      ? Math.min(availableMaxPrice, selectedMaxPriceRaw)
      : selectedMaxPriceRaw;

  const selectedMinPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.min(clampedMinPrice, clampedMaxPrice)
      : clampedMinPrice;
  const selectedMaxPrice =
    clampedMinPrice !== null && clampedMaxPrice !== null
      ? Math.max(clampedMinPrice, clampedMaxPrice)
      : clampedMaxPrice;

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

  const [dbProducts, rawBrands] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.brand.findMany({
      where: {
        products: {
          some: productBaseWhere,
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const brandOptions = rawBrands.map((brand) => ({
    id: brand.id,
    name: brand.name,
  }));

  const products: Product[] = dbProducts.map((product) => {
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
      status: "new" as const,
      isNew: true,
      tags: toStringArray(product.tags),
      featured: false,
      createdAt: product.createdAt,
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

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          ✦ Dernières arrivées
        </p>
        <h1 className="font-serif text-4xl text-ink">Nouveautés</h1>
        <p className="text-sm text-neutral-500">
          {products.length} nouveau{products.length > 1 ? "x" : ""} produit
          {products.length > 1 ? "s" : ""} — les articles restent ici tant que
          la case &laquo; Nouveauté &raquo; est cochée dans l&apos;admin.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Aucune nouveauté pour le moment — revenez bientôt !
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <CategoryFilters
              categoryHref="/nouveautes"
              filterGroups={[]}
              selectedBrands={selectedBrands}
              selectedMinPrice={selectedMinPrice}
              selectedMaxPrice={selectedMaxPrice}
              availableMinPrice={availableMinPrice}
              availableMaxPrice={availableMaxPrice}
              brandOptions={brandOptions}
            />
          </aside>

          <div className="lg:col-span-3 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4 sm:gap-x-6">
            {products.map((product) => {
              const hasSale =
                typeof product.salePrice === "number" &&
                product.salePrice < product.price;
              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link href={`/produit/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-neutral-50">
                      <SafeImage
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                      />
                      <div className="absolute left-2 top-2">
                        <span className="inline-flex items-center rounded-full bg-blush-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
                          Nouveauté
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 p-3 sm:p-4">
                      <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-medium text-ink sm:text-base">
                        {product.name}
                      </h3>
                      <p className="text-sm font-semibold text-ink">
                        {(product.salePrice ?? product.price).toFixed(0)} €
                        {hasSale && (
                          <span className="ml-2 text-xs font-normal text-neutral-400 line-through">
                            {product.price.toFixed(0)} €
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2.5 sm:px-4 sm:py-3">
                    <Link
                      href={`/produit/${product.id}`}
                      className="text-xs font-medium text-neutral-500 transition hover:text-ink"
                    >
                      Voir le produit
                    </Link>
                    <QuickAddToCart product={product} compact />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
