import { describe, expect, it } from "vitest";
import { loginSchema, bootstrapAdminSchema } from "../validations/auth";
import {
  slugSchema,
  productFilterSchema,
  idSchema,
} from "../validations/catalog";
import { checkoutSchema } from "../validations/order";
import { productUpsertSchema } from "../validations/product";
import { storefrontMainMenu } from "../menu";
import { newBrands } from "../new-brands";

describe("validation schemas", () => {
  it("validates auth payloads", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "123456789012",
      }).success,
    ).toBe(true);
    expect(
      bootstrapAdminSchema.safeParse({
        email: "bad",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("validates catalog filters", () => {
    const parsed = productFilterSchema.parse({ query: "bracelet", page: "2" });
    expect(parsed.page).toBe(2);
    expect(parsed.sort).toBe("newest");
    expect(slugSchema.safeParse({ slug: "slug-ok-1" }).success).toBe(true);
    expect(slugSchema.safeParse({ slug: "Slug KO" }).success).toBe(false);
    expect(idSchema.safeParse({ id: "abc" }).success).toBe(true);
  });

  it("validates checkout payload", () => {
    expect(
      checkoutSchema.safeParse({
        userId: "u1",
        email: "client@example.com",
        items: [{ productId: "p1", quantity: 2 }],
        shippingAddress: {
          firstName: "Nina",
          lastName: "L",
          line1: "10 rue de Paris",
          city: "Paris",
          postalCode: "75001",
          country: "France",
        },
      }).success,
    ).toBe(true);
  });

  it("validates product upsert payload", () => {
    expect(
      productUpsertSchema.safeParse({
        name: "Bracelet artisanal",
        slug: "bracelet-artisanal",
        description: "Description suffisamment longue pour être valide ici.",
        price: 2000,
        categoryId: "cat_1",
        brandId: "brand_1",
        images: ["https://example.com/a.jpg"],
        stock: 3,
        status: "ACTIVE",
        isNew: true,
        tags: ["artisanat"],
        variants: [],
      }).success,
    ).toBe(true);
  });
});

describe("menu and new brands data", () => {
  it("has main storefront menu entries", () => {
    expect(storefrontMainMenu.length).toBeGreaterThan(4);
    expect(storefrontMainMenu.some((item) => item.href === "/nouveautes")).toBe(
      true,
    );
  });

  it("new brands contain at least two entries with images and href", () => {
    expect(newBrands.length).toBeGreaterThanOrEqual(2);
    for (const brand of newBrands) {
      expect(brand.images.length).toBeGreaterThan(0);
      expect(brand.href.startsWith("/categorie/")).toBe(true);
    }
  });
});
