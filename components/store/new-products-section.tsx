import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProductsCarousel } from "@/components/store/new-products-carousel";
import type { Product } from "@/lib/catalog";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export async function NewProductsSection() {
  const dbProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", isNew: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (dbProducts.length === 0) return null;

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
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ Dernières arrivées
          </p>
          <h2 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
            Nouveautés
          </h2>
        </div>
        <Link
          href="/nouveautes"
          className="shrink-0 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Voir tout
        </Link>
      </div>
      <div className="px-4 sm:px-6">
        <NewProductsCarousel products={products} />
      </div>
    </section>
  );
}
