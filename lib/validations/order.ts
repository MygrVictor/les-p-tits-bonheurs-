import { z } from "zod";

export const checkoutSchema = z.object({
  userId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    line1: z.string().min(3).max(120),
    line2: z.string().max(120).optional(),
    city: z.string().min(2).max(80),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(80),
  }),
  email: z.string().email(),
});
