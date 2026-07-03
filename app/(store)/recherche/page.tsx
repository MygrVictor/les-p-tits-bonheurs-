import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/store/product-grid";

export const metadata: Metadata = {
  title: "Recherche — Les P'tits Bonheurs",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();

  const dbProducts =
    query.length >= 2
      ? await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
            ],
          },
          include: { variants: true },
          orderBy: { createdAt: "desc" },
          take: 60,
        })
      : [];

  const products = dbProducts.map((product) => {
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
      status: (product.status === "ACTIVE"
        ? "active"
        : product.status === "ARCHIVED"
          ? "inactive"
          : "new") as "active" | "inactive" | "new",
      isNew: product.isNew,
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
          Recherche
        </p>
        <h1 className="font-serif text-4xl text-ink">
          {query ? `Résultats pour « ${query} »` : "Rechercher un produit"}
        </h1>
        {query.length >= 2 && (
          <p className="text-sm text-neutral-500">
            {products.length} résultat{products.length > 1 ? "s" : ""}
          </p>
        )}
      </header>

      {query.length > 0 && query.length < 2 ? (
        <p className="text-sm text-neutral-500">
          Merci de saisir au moins 2 caractères.
        </p>
      ) : query.length >= 2 && products.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-neutral-500">
            Aucun produit ne correspond à votre recherche « {query} ».
          </p>
        </div>
      ) : query.length >= 2 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-sm text-neutral-500">
          Utilisez la barre de recherche en haut de la page pour trouver un
          produit.
        </p>
      )}
    </section>
  );
}
