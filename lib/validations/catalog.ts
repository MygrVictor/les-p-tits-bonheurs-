import { z } from "zod";

export const slugSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  query: z.string().max(80).optional(),
  stone: z.string().optional(),
  page: z.coerce.number().int().positive().max(100).default(1),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
});

export const idSchema = z.object({
  id: z.string().min(1),
});
