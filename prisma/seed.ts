import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { brands, categories, products } from "@/lib/catalog";

async function main() {
  const env = getEnv();
  const password = await hash(env.ADMIN_BOOTSTRAP_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: env.ADMIN_BOOTSTRAP_EMAIL },
    update: { password, role: "ADMIN" },
    create: {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password,
      role: "ADMIN",
    },
  });

  const categoryIdMap = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, parentId: category.parentId ?? null },
      create: {
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? null,
      },
    });
    categoryIdMap.set(category.id, record.id);
  }

  const brandIdMap = new Map<string, string>();
  for (const brand of brands) {
    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, logo: brand.logo ?? null },
      create: { name: brand.name, slug: brand.slug, logo: brand.logo ?? null },
    });
    brandIdMap.set(brand.id, record.id);
  }

  for (const product of products) {
    const categoryDbId = categoryIdMap.get(product.categoryId);
    const brandDbId = brandIdMap.get(product.brandId);

    if (!categoryDbId || !brandDbId) {
      continue;
    }

    await prisma.product.upsert({
      where: { slug: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: Math.round((product.salePrice ?? product.price) * 100),
        salePrice: product.salePrice
          ? Math.round(product.salePrice * 100)
          : null,
        images: product.images,
        stock: product.stock,
        status:
          product.status === "inactive"
            ? "ARCHIVED"
            : product.status === "new"
              ? "DRAFT"
              : "ACTIVE",
        isNew: product.isNew,
        tags: product.tags,
        categoryId: categoryDbId,
        brandId: brandDbId,
      },
      create: {
        name: product.name,
        slug: product.id,
        description: product.description,
        price: Math.round((product.salePrice ?? product.price) * 100),
        salePrice: product.salePrice
          ? Math.round(product.salePrice * 100)
          : null,
        images: product.images,
        stock: product.stock,
        status:
          product.status === "inactive"
            ? "ARCHIVED"
            : product.status === "new"
              ? "DRAFT"
              : "ACTIVE",
        isNew: product.isNew,
        tags: product.tags,
        categoryId: categoryDbId,
        brandId: brandDbId,
      },
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
