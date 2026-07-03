import { z } from "zod";

const variantSchema = z.object({
  name: z.string().min(1).max(80),
  value: z.string().min(1).max(120),
  stock: z.coerce.number().int().min(0),
  price: z.coerce.number().int().min(0).optional(),
});

const stoneSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  virtues: z.array(z.string().min(1).max(80)).min(1),
});

export const productUpsertSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(20).max(5000),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  subCategoryId: z.string().optional(),
  images: z.array(z.string().url()).min(1).max(8),
  stock: z.coerce.number().int().min(0),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isNew: z.boolean(),
  tags: z.array(z.string().min(1).max(40)).max(20),
  variants: z.array(variantSchema).max(12),
  stone: stoneSchema.optional(),
});
