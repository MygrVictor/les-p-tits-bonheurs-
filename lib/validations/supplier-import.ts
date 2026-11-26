import { z } from "zod";

/**
 * Payload renvoyé par l'écran de prévisualisation au moment de la validation.
 * On revalide intégralement côté serveur : le client a pu modifier le JSON
 * entre la prévisualisation et le commit.
 */

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().catch(null);

const nullableNumber = z.number().finite().nonnegative().nullable().catch(null);

export const supplierSpecSchema = z.object({
  ean: nullableText(20),
  origin: nullableText(120),
  dimensionsCm: nullableText(120),
  dimensionsInches: nullableText(120),
  weightKg: nullableNumber,
  weightOunces: nullableNumber,
  packagingDimensionsCm: nullableText(120),
  packagingDimensionsInches: nullableText(120),
  casepackEan: nullableText(20),
  casepackQty: nullableNumber,
  casepackDimensions: nullableText(120),
  casepackWeightKg: nullableNumber,
  masterpackEan: nullableText(20),
  masterpackQty: nullableNumber,
  masterpackDimensions: nullableText(120),
  masterpackNetWeightKg: nullableNumber,
  masterpackGrossWeightKg: nullableNumber,
});

export const supplierImportRowSchema = z.object({
  supplierRef: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  categoryName: z.string().trim().min(1).max(120).nullable(),
  imageUrl: z.string().url().max(2000).nullable(),
  sourceSheet: z.string().max(200),
  sourceRow: z.number().int().nonnegative(),
  spec: supplierSpecSchema,
});

export const supplierImportCommitSchema = z.object({
  // La marque n'est pas dans le fichier : c'est le contexte de l'upload,
  // choisi par l'admin parmi les marques existantes.
  brandId: z.string().min(1),
  // Catégorie parente sous laquelle ranger les sections détectées.
  // Null = catégories créées à la racine.
  parentCategoryId: z.string().min(1).nullable(),
  rows: z.array(supplierImportRowSchema).min(1).max(2000),
});

export type SupplierImportCommitInput = z.infer<
  typeof supplierImportCommitSchema
>;
export type SupplierImportRowInput = z.infer<typeof supplierImportRowSchema>;
