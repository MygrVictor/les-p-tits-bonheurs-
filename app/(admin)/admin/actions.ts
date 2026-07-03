"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinaryClient } from "@/lib/cloudinary";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function redirectCreateProductError(message: string): never {
  redirect(`/admin/produits/nouveau?error=${encodeURIComponent(message)}`);
}

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
}

async function uploadProductImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension =
    file.type
      .split("/")[1]
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";

  try {
    const cloudinary = getCloudinaryClient();

    const uploaded = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "les-ptits-bonheurs/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Upload failed"));
              return;
            }
            resolve({ secure_url: result.secure_url });
          },
        );

        stream.end(buffer);
      },
    );

    return uploaded.secure_url;
  } catch {
    try {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "products",
      );
      await mkdir(uploadDir, { recursive: true });

      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      return `/uploads/products/${filename}`;
    } catch {
      return null;
    }
  }
}

export async function createCategory(formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentIdInput = String(formData.get("parentId") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!name || !slug) return;

  await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentIdInput || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/produits/nouveau");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentIdInput = String(formData.get("parentId") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!categoryId || !name || !slug) return;
  if (parentIdInput === categoryId) return;

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug,
      parentId: parentIdInput || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/produits/nouveau");
}

export async function deleteCategory(categoryId: string) {
  await ensureAdmin();

  if (!categoryId) return;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  if (!category) return;
  if (category._count.products > 0 || category._count.children > 0) return;

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/produits/nouveau");
}

export async function createBrand(formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const logoInput = String(formData.get("logo") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!name || !slug) return;

  await prisma.brand.create({
    data: {
      name,
      slug,
      logo: logoInput || null,
    },
  });

  revalidatePath("/admin/marques");
  revalidatePath("/admin/produits");
  revalidatePath("/admin/produits/nouveau");
}

export async function updateBrand(brandId: string, formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const logoInput = String(formData.get("logo") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!brandId || !name || !slug) return;

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      name,
      slug,
      logo: logoInput || null,
    },
  });

  revalidatePath("/admin/marques");
  revalidatePath("/admin/produits");
  revalidatePath("/admin/produits/nouveau");
}

export async function deleteBrand(brandId: string) {
  await ensureAdmin();

  if (!brandId) return;

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { _count: { select: { products: true } } },
  });

  if (!brand || brand._count.products > 0) return;

  await prisma.brand.delete({ where: { id: brandId } });

  revalidatePath("/admin/marques");
  revalidatePath("/admin/produits");
  revalidatePath("/admin/produits/nouveau");
}

export async function createProduct(formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);
  const description = String(formData.get("description") ?? "").trim();
  const priceEuros = Number(String(formData.get("price") ?? "0").trim());
  const stock = Number(String(formData.get("stock") ?? "0").trim());
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const subCategoryId = String(formData.get("subCategoryId") ?? "").trim();
  const resolvedCategoryId = subCategoryId || categoryId;
  const brandId = String(formData.get("brandId") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const isNew = String(formData.get("isNew") ?? "false") === "true";
  const imagesRaw = String(formData.get("images") ?? "").trim();
  const files = formData
    .getAll("imagesFiles")
    .filter((entry): entry is File => entry instanceof File);
  const tagsRaw = String(formData.get("tags") ?? "").trim();

  if (!name || !slug || !description || !resolvedCategoryId || !brandId) {
    redirectCreateProductError(
      "Veuillez remplir tous les champs obligatoires.",
    );
  }

  if (!Number.isFinite(priceEuros) || priceEuros < 0) {
    redirectCreateProductError("Le prix doit être un nombre positif.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    redirectCreateProductError("Le stock doit être un nombre positif.");
  }

  const [categoryExists, brandExists, slugExists] = await Promise.all([
    prisma.category.findUnique({
      where: { id: resolvedCategoryId },
      select: { id: true },
    }),
    prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    }),
  ]);

  if (!categoryExists) {
    redirectCreateProductError("Catégorie invalide.");
  }

  if (!brandExists) {
    redirectCreateProductError("Marque invalide.");
  }

  if (slugExists) {
    redirectCreateProductError(
      "Ce slug existe déjà. Modifiez le nom ou le slug.",
    );
  }

  const imageUrlsFromText = imagesRaw
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => /^https?:\/\//i.test(entry) || entry.startsWith("/"))
    .filter(Boolean);

  const uploadedImages = (
    await Promise.all(files.map((file) => uploadProductImage(file)))
  ).filter((url): url is string => Boolean(url));

  const images = [...uploadedImages, ...imageUrlsFromText];

  if (files.length > 0 && uploadedImages.length === 0) {
    redirectCreateProductError(
      "Upload image impossible. Vérifiez les droits d'écriture du serveur ou ajoutez une URL d'image.",
    );
  }

  if (images.length === 0) {
    redirectCreateProductError("Ajoutez au moins une image (upload ou URL).");
  }

  const tags = Array.from(
    new Set(
      tagsRaw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );

  const uniqueImages = Array.from(new Set(images));

  const createdProduct = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price: Math.max(0, Math.round(priceEuros * 100)),
      stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
      categoryId: resolvedCategoryId,
      brandId,
      status: status === "ACTIVE" || status === "ARCHIVED" ? status : "DRAFT",
      isNew,
      images: uniqueImages,
      tags,
    },
    select: {
      slug: true,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/produit/${createdProduct.slug}`);
  revalidatePath("/");
  redirect(`/produit/${createdProduct.slug}`);
}

export async function updateProductStock(
  productId: string,
  formData: FormData,
) {
  await ensureAdmin();

  const stock = Number(String(formData.get("stock") ?? "0").trim());

  if (!productId) return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
    },
  });

  revalidatePath("/admin/produits");
}

export async function updateProduct(productId: string, formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceEuros = Number(String(formData.get("price") ?? "0").trim());
  const stock = Number(String(formData.get("stock") ?? "0").trim());
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const subCategoryId = String(formData.get("subCategoryId") ?? "").trim();
  const resolvedCategoryId = subCategoryId || categoryId;
  const brandId = String(formData.get("brandId") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const isNew = String(formData.get("isNew") ?? "false") === "true";

  if (!productId || !name || !description || !resolvedCategoryId || !brandId)
    return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      description,
      price: Math.max(0, Math.round(priceEuros * 100)),
      stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
      categoryId: resolvedCategoryId,
      brandId,
      status: status === "ACTIVE" || status === "ARCHIVED" ? status : "DRAFT",
      isNew,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}/modifier`);
  redirect("/admin/produits");
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await ensureAdmin();

  const status = String(formData.get("status") ?? "PENDING").trim();
  const allowed = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  if (!orderId || !allowed.includes(status)) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as
        | "PENDING"
        | "CONFIRMED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED",
    },
  });

  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
}
