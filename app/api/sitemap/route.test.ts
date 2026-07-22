import { beforeEach, describe, expect, it, vi } from "vitest";

const productFindManyMock = vi.fn();
const categoryFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: productFindManyMock },
    category: { findMany: categoryFindManyMock },
  },
}));

describe("GET /api/sitemap", () => {
  beforeEach(() => {
    vi.resetModules();
    productFindManyMock.mockReset();
    categoryFindManyMock.mockReset();
  });

  it("returns xml including category and product URLs", async () => {
    productFindManyMock.mockResolvedValue([{ slug: "bracelet-acier" }]);
    categoryFindManyMock.mockResolvedValue([{ slug: "bijouterie" }]);

    const { GET } = await import("./route");
    const res = await GET();
    const xml = await res.text();

    expect(res.status).toBe(200);
    expect(xml).toContain("<?xml");
    expect(xml).toContain("/categorie/bijouterie");
    expect(xml).toContain("/produit/bracelet-acier");
  });
});
