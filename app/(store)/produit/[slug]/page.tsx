import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductById } from "@/lib/catalog";
import { slugSchema } from "@/lib/validations/catalog";
import { prisma } from "@/lib/prisma";
import { AddToCartActions } from "@/components/store/add-to-cart";

export const revalidate = 900;

export function generateStaticParams() {
  return [
    "product-1",
    "product-2",
    "product-3",
    "product-4",
    "product-5",
    "product-6",
    "product-7",
    "product-8",
  ].map((slug) => ({ slug }));
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export default async function ProductPage({
  params,
}: Readonly<{ params: { slug: string } }>) {
  const parsed = slugSchema.safeParse({ slug: params.slug });
  if (!parsed.success) {
    notFound();
  }

  const dbProduct = await prisma.product.findFirst({
    where: {
      OR: [{ slug: parsed.data.slug }, { id: parsed.data.slug }],
      status: "ACTIVE",
    },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const staticProduct = getProductById(parsed.data.slug);
  const product =
    dbProduct !== null
      ? {
          id: dbProduct.slug,
          name: dbProduct.name,
          description: dbProduct.description,
          images: toStringArray(dbProduct.images),
          price: dbProduct.price / 100,
          salePrice: dbProduct.salePrice ? dbProduct.salePrice / 100 : null,
          brandName: dbProduct.brand.name,
          categoryName: dbProduct.category.name,
          stock: dbProduct.stock,
        }
      : staticProduct
        ? {
            id: staticProduct.id,
            name: staticProduct.name,
            description: staticProduct.description,
            images: staticProduct.images,
            price: staticProduct.price,
            salePrice: staticProduct.salePrice ?? null,
            brandName: staticProduct.brandId,
            categoryName: staticProduct.categoryId,
            stock: staticProduct.stock,
          }
        : null;

  if (!product) {
    notFound();
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {product.images.map((image) => (
          <div
            key={image}
            className="overflow-hidden rounded-3xl bg-white shadow-soft"
          >
            <Image
              src={image}
              alt={product.name}
              width={900}
              height={1100}
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAAAAACw="
              className="h-full w-full object-cover transition duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>
      <div className="space-y-6 rounded-3xl bg-white p-8 shadow-soft">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
            Produit
          </p>
          <h1 className="font-serif text-4xl text-ink">{product.name}</h1>
          <p className="text-sm text-neutral-500">
            Marque {product.brandName} · Catégorie {product.categoryName}
          </p>
        </div>
        <p className="text-base leading-8 text-neutral-700">
          {product.description}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold text-blush-700">
            {product.salePrice ?? product.price} €
          </span>
          {product.salePrice ? (
            <span className="text-sm text-neutral-400 line-through">
              {product.price} €
            </span>
          ) : null}
        </div>
        <AddToCartActions
          productId={product.id}
          name={product.name}
          price={Math.round((product.salePrice ?? product.price) * 100)}
          salePrice={
            product.salePrice ? Math.round(product.salePrice * 100) : null
          }
          image={product.images[0] ?? ""}
          stock={product.stock}
        />
      </div>
    </section>
  );
}
