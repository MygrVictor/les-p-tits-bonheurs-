import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/product-grid";

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

function isWithinNewWindow(createdAt: Date, days = 90): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt.getTime() >= cutoff;
}

/**
 * "Nouveautés" est une collection transverse (basée sur le flag `isNew` des
 * produits), pas une catégorie de la base de données — elle regroupe les
 * dernières arrivées de toutes les familles de produits confondues.
 */
export default async function NouveautesPage() {
  const dbProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", isNew: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const products = dbProducts
    .filter((product) => isWithinNewWindow(product.createdAt, 90))
    .map((product) => {
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
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          ✦ Dernières arrivées
        </p>
        <h1 className="font-serif text-4xl text-ink">Nouveautés</h1>
        <p className="text-sm text-neutral-500">
          {products.length} nouveau{products.length > 1 ? "x" : ""} produit
          {products.length > 1 ? "s" : ""}, toutes familles confondues.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Aucune nouveauté pour le moment — revenez bientôt !
          </p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}
