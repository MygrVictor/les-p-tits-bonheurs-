import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: categoryFindManyMock },
  },
}));

describe("GET /api/storefront/nav", () => {
  beforeEach(() => {
    vi.resetModules();
    categoryFindManyMock.mockReset();
  });

  it("returns categories with deduplicated and sorted brands", async () => {
    categoryFindManyMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Bijouterie",
        slug: "bijouterie",
        products: [
          { brand: { id: "b2", name: "Zag" } },
          { brand: { id: "b1", name: "Ambre" } },
          { brand: { id: "b2", name: "Zag" } },
        ],
      },
    ]);

    const { GET } = await import("./route");
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json[0].brands).toHaveLength(2);
    expect(json[0].brands[0].name).toBe("Ambre");
    expect(json[0].brands[1].name).toBe("Zag");
  });
});
