import { describe, it, expect } from "vitest";
import {
  categories,
  brands,
  products,
  stats,
  getCategoryBySlug,
  getBrandById,
  getProductById,
  getProductsByCategorySlug,
  getFeaturedProducts,
  getProductsByStoneName,
} from "../catalog";

describe("catalog static data", () => {
  it("loads categories, brands and products", () => {
    expect(categories.length).toBeGreaterThan(0);
    expect(brands.length).toBeGreaterThan(0);
    expect(products.length).toBeGreaterThan(0);
    expect(stats.totalProducts).toBe(products.length);
  });
});

describe("catalog helpers", () => {
  it("finds existing category by slug", () => {
    const first = categories[0];
    expect(getCategoryBySlug(first.slug)?.id).toBe(first.id);
  });

  it("finds existing brand by id", () => {
    const first = brands[0];
    expect(getBrandById(first.id)?.slug).toBe(first.slug);
  });

  it("finds existing product by id", () => {
    const first = products[0];
    expect(getProductById(first.id)?.name).toBe(first.name);
  });

  it("returns empty list for unknown category slug", () => {
    expect(getProductsByCategorySlug("nope")).toEqual([]);
  });

  it("returns products matching category slug", () => {
    const category = categories.find((c) =>
      products.some((p) => p.categoryId === c.id),
    );
    expect(category).toBeDefined();
    const items = getProductsByCategorySlug(category!.slug);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.categoryId === category!.id)).toBe(true);
  });

  it("returns featured products subset", () => {
    const featured = getFeaturedProducts();
    expect(featured.every((p) => Boolean(p.featured))).toBe(true);
  });

  it("filters products by stone name case-insensitively", () => {
    const withStone = products.find((p) => p.stones.length > 0);
    if (!withStone) {
      expect(getProductsByStoneName("amethyste")).toEqual([]);
      return;
    }
    const stoneName = withStone.stones[0].name;
    const result = getProductsByStoneName(stoneName.toUpperCase());
    expect(result.some((p) => p.id === withStone.id)).toBe(true);
  });
});
