"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinaryClient } from "@/lib/cloudinary";
import { PRODUCT_COLORS } from "@/lib/colors";
import { CARRIERS } from "@/lib/carriers";
import { sendShippingNotification } from "@/lib/order-notifications";

// Limite volontaire (pas une contrainte Cloudinary/DB) : 3 photos par
// produit suffisent largement pour une boutique artisanale, et évitent des
// fiches produit trop lourdes à charger côté client.
const MAX_PRODUCT_IMAGES = 6;

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
    redirect("/compte");
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
            // Limite la taille stockée : les photos de smartphone (souvent
            // 10-12 Mpx) sont inutilement lourdes pour une fiche produit.
            // "limit" ne fait que réduire (jamais agrandir) en conservant le
            // ratio, ce qui économise du stockage et de la bande passante
            // Cloudinary sans perte de qualité perceptible sur le site.
            transformation: [{ width: 2000, height: 2000, crop: "limit" }],
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
  } catch (cloudinaryError) {
    // Loggé côté serveur (visible dans les logs Vercel) pour diagnostiquer
    // rapidement une mauvaise configuration Cloudinary, plutôt que
    // d'échouer silencieusement et de laisser un message d'erreur générique
    // sans indice côté utilisateur.
    console.error(
      "[uploadProductImage] Échec de l'upload Cloudinary :",
      cloudinaryError,
    );

    // Sur les plateformes serverless (Vercel…), le système de fichiers est
    // en lecture seule : cette écriture locale échouera toujours et ne sert
    // que de filet de sécurité pour le développement local.
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
    } catch (localWriteError) {
      console.error(
        "[uploadProductImage] Échec du fallback disque local (attendu sur Vercel/serverless) :",
        localWriteError,
      );
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
  const colorInput = String(formData.get("color") ?? "").trim();
  const color =
    colorInput && PRODUCT_COLORS.some((c) => c.id === colorInput)
      ? colorInput
      : null;
  const imagesRaw = String(formData.get("images") ?? "").trim();
  const imageUrlFields = [
    String(formData.get("imageUrl1") ?? "").trim(),
    String(formData.get("imageUrl2") ?? "").trim(),
    String(formData.get("imageUrl3") ?? "").trim(),
    String(formData.get("imageUrl4") ?? "").trim(),
    String(formData.get("imageUrl5") ?? "").trim(),
    String(formData.get("imageUrl6") ?? "").trim(),
  ];
  const files = formData
    .getAll("imagesFiles")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
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

  const imageUrlsFromText = [...imageUrlFields, ...imagesRaw.split(/\r?\n|,/)]
    .map((entry) => entry.trim())
    .filter((entry) => /^https?:\/\//i.test(entry) || entry.startsWith("/"))
    .filter(Boolean);

  const uploadedImages = (
    await Promise.all(files.map((file) => uploadProductImage(file)))
  ).filter((url): url is string => Boolean(url));

  if (files.length > MAX_PRODUCT_IMAGES) {
    redirectCreateProductError(
      `Maximum ${MAX_PRODUCT_IMAGES} images en upload à la création.`,
    );
  }

  const images = [...uploadedImages, ...imageUrlsFromText].slice(
    0,
    MAX_PRODUCT_IMAGES,
  );

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
      color,
      images: uniqueImages,
      tags,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/produit/${createdProduct.slug}`);
  revalidatePath("/");
  redirect(`/admin/produits/${createdProduct.id}/modifier`);
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
  const colorInput = String(formData.get("color") ?? "").trim();
  const color =
    colorInput && PRODUCT_COLORS.some((c) => c.id === colorInput)
      ? colorInput
      : null;

  // Images existantes conservées (cases à cocher décochées = supprimées),
  // plus d'éventuelles nouvelles images (upload ou URL). Le tout plafonné
  // à MAX_PRODUCT_IMAGES pour rester cohérent avec la création.
  const keptImages = formData
    .getAll("keepImage")
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  const newImagesRaw = String(formData.get("newImages") ?? "").trim();
  const newImageUrls = newImagesRaw
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => /^https?:\/\//i.test(entry) || entry.startsWith("/"))
    .filter(Boolean);
  const newFiles = formData
    .getAll("newImagesFiles")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!productId || !name || !description || !resolvedCategoryId || !brandId)
    return;

  const uploadedNewImages = (
    await Promise.all(newFiles.map((file) => uploadProductImage(file)))
  ).filter((url): url is string => Boolean(url));

  const images = Array.from(
    new Set([...keptImages, ...uploadedNewImages, ...newImageUrls]),
  ).slice(0, MAX_PRODUCT_IMAGES);

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
      color,
      // N'écrase les images que si la liste finale n'est pas vide — évite
      // de vider par accident les photos d'un produit si le navigateur
      // n'a soumis aucun champ image pour une raison quelconque.
      ...(images.length > 0 ? { images } : {}),
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}/modifier`);
  redirect("/admin/produits");
}

// Suppression définitive impossible pour un produit déjà présent dans une
// commande (contrainte ON DELETE RESTRICT en base, voir migration.sql) :
// ça casserait l'historique des commandes passées. Dans ce cas, on redirige
// avec un message qui invite à archiver le produit plutôt (statut
// « Archivé » — il disparaît de la boutique sans toucher aux commandes).
export async function deleteProduct(productId: string) {
  await ensureAdmin();

  if (!productId) return;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      _count: { select: { orderItems: true } },
    },
  });

  if (!product) return;

  if (product._count.orderItems > 0) {
    redirect(
      `/admin/produits/${productId}/modifier?error=${encodeURIComponent(
        "Impossible de supprimer ce produit : il fait partie de commandes déjà passées. Archivez-le plutôt (statut « Archivé ») pour le retirer de la boutique sans casser l'historique des commandes.",
      )}`,
    );
  }

  // Les variantes et la fiche pierre associées sont aussi en ON DELETE
  // RESTRICT : il faut les supprimer explicitement avant le produit
  // lui-même, dans une transaction pour rester atomique.
  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId } }),
    prisma.stone.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);

  revalidatePath("/admin/produits");
  revalidatePath("/");
  redirect("/admin/produits");
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await ensureAdmin();

  const status = String(formData.get("status") ?? "PENDING").trim();
  const allowed = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  const carrierInput = String(formData.get("carrier") ?? "").trim();
  const trackingNumberInput = String(
    formData.get("trackingNumber") ?? "",
  ).trim();

  if (!orderId || !allowed.includes(status)) return;

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      carrier: true,
      trackingNumber: true,
      user: { select: { email: true } },
    },
  });

  if (!existingOrder) return;

  const carrier =
    carrierInput && CARRIERS.some((c) => c.id === carrierInput)
      ? carrierInput
      : null;
  const trackingNumber = trackingNumberInput || null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as
        | "PENDING"
        | "CONFIRMED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED",
      carrier,
      trackingNumber,
    },
  });

  // Email de suivi envoyé uniquement quand un numéro est renseigné ET qu'il
  // est nouveau ou a changé depuis la dernière fois — évite de spammer le
  // client si l'admin ne fait que changer le statut sans toucher au suivi
  // (ou soumet le formulaire sans rien modifier).
  const trackingChanged =
    trackingNumber !== null &&
    (trackingNumber !== existingOrder.trackingNumber ||
      carrier !== existingOrder.carrier);

  let emailStatus: "sent" | "failed" | "unchanged" = "unchanged";

  if (trackingChanged && existingOrder.user.email) {
    const sent = await sendShippingNotification({
      email: existingOrder.user.email,
      orderId,
      carrier,
      trackingNumber,
    });
    emailStatus = sent ? "sent" : "failed";
  }

  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  revalidatePath("/compte");

  // Redirection avec un statut d'envoi lisible par l'admin — sans ça, rien
  // n'indique visuellement si l'email de suivi est réellement parti ou a
  // été refusé (ex. limite du mode test Resend, clé invalide…).
  redirect(
    `/admin/commandes?emailStatus=${emailStatus}&order=${orderId.slice(-6).toUpperCase()}`,
  );
}

export async function approveReview(reviewId: string) {
  await ensureAdmin();
  if (!reviewId) return;

  await prisma.review.update({
    where: { id: reviewId },
    data: { approved: true },
  });

  revalidatePath("/admin/avis");
}

export async function deleteReview(reviewId: string) {
  await ensureAdmin();
  if (!reviewId) return;

  await prisma.review.delete({ where: { id: reviewId } });

  revalidatePath("/admin/avis");
}
