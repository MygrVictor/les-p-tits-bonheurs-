import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyCategoryMock = vi.fn();
const findManyProductMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: findManyCategoryMock },
    product: { findMany: findManyProductMock },
  },
}));

describe("storefront", () => {
  beforeEach(() => {
    vi.resetModules();
    findManyCategoryMock.mockReset();
    findManyProductMock.mockReset();
  });

  it("merges DB categories with fallback catalog categories", async () => {
    findManyCategoryMock.mockResolvedValue([
      { id: "db-bijoux", name: "Bijoux", slug: "bijoux" },
    ]);

    const { getStoreCategories } = await import("../storefront");
    const categories = await getStoreCategories();

    expect(categories.length).toBeGreaterThan(3);
    expect(categories.find((c) => c.slug === "bijoux")?.id).toBe("db-bijoux");
    expect(categories.find((c) => c.slug === "perlerie")?.id).toBe(
      "cat-perlerie",
    );
  });

  it("maps featured products with fallback image and normalized fields", async () => {
    findManyProductMock.mockResolvedValue([
      {
        id: "p1",
        slug: "bracelet-acier",
        name: "Bracelet Acier",
        description: "desc",
        price: 2500,
        salePrice: 1900,
        brandId: "b1",
        categoryId: "c1",
        images: [],
        stock: 8,
        status: "ACTIVE",
        isNew: true,
        createdAt: new Date(),
        tags: ["featured"],
        variants: [
          {
            id: "v1",
            productId: "p1",
            name: "Taille",
            value: "M",
            stock: 2,
            price: 2700,
          },
        ],
      },
      {
        id: "p2",
        slug: "vieux-produit",
        name: "Vieux produit",
        description: "desc",
        price: 1200,
        salePrice: null,
        brandId: "b2",
        categoryId: "c2",
        images: ["https://img.local/x.jpg"],
        stock: 3,
        status: "ARCHIVED",
        isNew: true,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        tags: [],
        variants: [],
      },
    ]);

    const { getFeaturedStoreProducts, getBentoStoreProducts } =
      await import("../storefront");
    const featured = await getFeaturedStoreProducts(2);
    const bento = await getBentoStoreProducts(2);

    expect(featured).toHaveLength(2);
    expect(featured[0].id).toBe("bracelet-acier");
    expect(featured[0].price).toBe(25);
    expect(featured[0].salePrice).toBe(19);
    expect(featured[0].images[0]).toContain("images.unsplash.com");
    expect(featured[0].status).toBe("active");
    expect(featured[0].isNew).toBe(true);
    expect(featured[0].variants[0].price).toBe(27);

    expect(featured[1].status).toBe("inactive");
    expect(featured[1].isNew).toBe(false);

    expect(bento).toHaveLength(2);
  });
});
