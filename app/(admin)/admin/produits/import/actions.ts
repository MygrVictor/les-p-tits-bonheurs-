"use server";

import { revalidatePath } from "next/cache";
import { revalidateCatalog } from "@/lib/catalog-cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinaryClient } from "@/lib/cloudinary";
import { actionClient } from "@/lib/safe-action";
import { supplierImportCommitSchema } from "@/lib/validations/supplier-import";
import type { SupplierImportRowInput } from "@/lib/validations/supplier-import";

/**
 * Écriture effective de l'import fournisseur.
 *
 * Les produits sont créés en DRAFT avec un prix à 0 : les fichiers de specs
 * fournisseur ne contiennent ni prix de vente ni description commerciale.
 * L'admin complète ensuite depuis la fiche produit, et rien n'est publié
 * tant que le prix n'est pas renseigné.
 */

// Chaque produit importé est repérable dans l'admin par ce tag, pour pouvoir
// filtrer les fiches restant à compléter après un import.
const IMPORT_TAG = "import-fournisseur";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Garantit l'unicité du slug : deux fournisseurs peuvent nommer un produit
 * « Grand cerf ». On suffixe par la REF, qui est unique par construction.
 */
function buildProductSlug(name: string, supplierRef: string): string {
  const base = slugify(name) || "produit";
  return `${base}-${slugify(supplierRef)}`;
}

type ImportSummary = {
  created: number;
  updated: number;
  skipped: Array<{ supplierRef: string; reason: string }>;
  categoriesCreated: string[];
  /** REF dont la photo n'a pas pu être récupérée (produit créé sans image). */
  imageFailures: string[];
};

const MAX_IMAGES_PER_PRODUCT = 6;

/**
 * Certains fournisseurs (Studio Roof) donnent l'adresse d'une page galerie
 * et non d'une image. On ouvre la page et on récupère les photos en pleine
 * résolution : liens `href` vers des .jpg/.png/.webp, en écartant les
 * miniatures WordPress (suffixe -321x450, -571x800…).
 */
async function resolveImageSources(sourceUrl: string): Promise<string[]> {
  const response = await fetch(sourceUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return [];

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.startsWith("image/")) return [response.url || sourceUrl];
  if (!contentType.includes("text/html")) return [];

  const html = await response.text();
  const base = new URL(response.url || sourceUrl);
  const found = new Set<string>();

  for (const match of html.matchAll(
    /href="([^"]+\.(?:jpe?g|png|webp))(?:\?[^"]*)?"/gi,
  )) {
    const absolute = new URL(match[1], base).toString();
    if (/-\d+x\d+\.(?:jpe?g|png|webp)$/i.test(absolute)) continue;
    found.add(absolute);
  }

  // Repli : page sans liens directs, on prend l'image de partage.
  if (found.size === 0) {
    const og = html.match(
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    )?.[1];
    if (og) found.add(new URL(og, base).toString());
  }

  // Photo produit d'abord, visuels d'ambiance ensuite : le nom de fichier
  // contient souvent PRODUCT, et la première image sert de vignette.
  return [...found]
    .sort((a, b) => Number(/product/i.test(b)) - Number(/product/i.test(a)))
    .slice(0, MAX_IMAGES_PER_PRODUCT);
}

/**
 * Copie les photos fournisseur sur Cloudinary. Indispensable : le site
 * n'affiche que les images hébergées sur des domaines autorisés
 * (next.config.mjs), et les liens fournisseur expirent ou changent.
 */
async function rehostImages(
  sourceUrl: string,
  supplierRef: string,
): Promise<string[]> {
  let sources: string[];
  try {
    sources = await resolveImageSources(sourceUrl);
  } catch (error) {
    console.error(
      `[commitSupplierImport] Lien photo inaccessible pour ${supplierRef} (${sourceUrl}) :`,
      error,
    );
    return [];
  }

  const hosted: string[] = [];
  for (const [index, source] of sources.entries()) {
    try {
      const result = await getCloudinaryClient().uploader.upload(source, {
        folder: "les-ptits-bonheurs/fournisseurs",
        public_id: `${slugify(supplierRef)}-${index + 1}`,
        overwrite: true,
        resource_type: "image",
      });
      hosted.push(result.secure_url);
    } catch (error) {
      console.error(
        `[commitSupplierImport] Échec d'upload pour ${supplierRef} (${source}) :`,
        error,
      );
    }
  }
  return hosted;
}

/** Crée à la demande les catégories détectées et renvoie leur id par nom. */
async function resolveCategories(
  rows: SupplierImportRowInput[],
  parentCategoryId: string | null,
): Promise<{ byName: Map<string, string>; created: string[] }> {
  const names = [
    ...new Set(
      rows
        .map((row) => row.categoryName)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const byName = new Map<string, string>();
  const created: string[] = [];

  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      byName.set(name, existing.id);
      continue;
    }

    const category = await prisma.category.create({
      data: { name, slug, parentId: parentCategoryId },
    });
    byName.set(name, category.id);
    created.push(name);
  }

  return { byName, created };
}

export const commitSupplierImport = actionClient
  .inputSchema(supplierImportCommitSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Accès refusé.");
    }

    const { brandId, parentCategoryId, rows } = parsedInput;

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new Error("Marque introuvable.");

    if (parentCategoryId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentCategoryId },
      });
      if (!parent) throw new Error("Catégorie parente introuvable.");
    }

    const { byName, created: categoriesCreated } = await resolveCategories(
      rows,
      parentCategoryId,
    );

    const summary: ImportSummary = {
      created: 0,
      updated: 0,
      skipped: [],
      categoriesCreated,
      imageFailures: [],
    };

    for (const row of rows) {
      const categoryId = row.categoryName
        ? byName.get(row.categoryName)
        : undefined;

      // categoryId est obligatoire sur Product : sans catégorie de section,
      // on ne peut pas rattacher le produit — on le signale plutôt que de
      // le ranger arbitrairement ailleurs.
      if (!categoryId) {
        summary.skipped.push({
          supplierRef: row.supplierRef,
          reason: "Aucune catégorie détectée pour cette ligne",
        });
        continue;
      }

      const images = row.imageUrl
        ? await rehostImages(row.imageUrl, row.supplierRef)
        : [];
      if (row.imageUrl && images.length === 0) {
        summary.imageFailures.push(row.supplierRef);
      }
      const specData = {
        supplierRef: row.supplierRef,
        sourceSheet: row.sourceSheet,
        sourceRow: row.sourceRow,
        ...row.spec,
        casepackQty: row.spec.casepackQty ?? null,
        masterpackQty: row.spec.masterpackQty ?? null,
      };

      try {
        const existing = await prisma.product.findUnique({
          where: { sku: row.supplierRef },
          select: { id: true },
        });

        if (existing) {
          // Mise à jour volontairement partielle : on ne réécrit ni le prix,
          // ni la description, ni le statut, qui sont du travail éditorial
          // fait dans l'admin et qu'un réimport ne doit pas écraser.
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              categoryId,
              brandId,
              ...(images.length > 0 ? { images } : {}),
              supplierSpec: {
                upsert: { create: specData, update: specData },
              },
            },
          });
          summary.updated += 1;
        } else {
          await prisma.product.create({
            data: {
              sku: row.supplierRef,
              name: row.name,
              slug: buildProductSlug(row.name, row.supplierRef),
              description: "",
              price: 0,
              stock: 0,
              status: "DRAFT",
              images,
              tags: [IMPORT_TAG],
              brandId,
              categoryId,
              supplierSpec: { create: specData },
            },
          });
          summary.created += 1;
        }
      } catch (error) {
        console.error(
          `[commitSupplierImport] Échec sur la REF ${row.supplierRef} :`,
          error,
        );
        summary.skipped.push({
          supplierRef: row.supplierRef,
          reason: "Erreur d'écriture en base",
        });
      }
    }

    revalidatePath("/admin/produits");
    revalidatePath("/admin/categories");
    revalidateCatalog();

    return summary;
  });
