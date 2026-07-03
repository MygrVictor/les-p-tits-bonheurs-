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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, parentId: category.parentId ?? null },
      create: {
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? null,
      },
    });
  }

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, logo: brand.logo ?? null },
      create: { name: brand.name, slug: brand.slug, logo: brand.logo ?? null },
    });
  }

  for (const product of products) {
    const category = categories.find(
      (entry) => entry.id === product.categoryId,
    );
    const brand = brands.find((entry) => entry.id === product.brandId);

    if (!category || !brand) {
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
        categoryId: category.id,
        brandId: brand.id,
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
        categoryId: category.id,
        brandId: brand.id,
      },
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
