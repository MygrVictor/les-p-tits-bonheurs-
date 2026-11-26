import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const productFindManyMock = vi.fn();
const productAggregateMock = vi.fn();
const categoryFindUniqueMock = vi.fn();
const categoryFindManyMock = vi.fn();
const brandFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: productFindManyMock,
      aggregate: productAggregateMock,
    },
    category: {
      findUnique: categoryFindUniqueMock,
      findMany: categoryFindManyMock,
    },
    brand: { findMany: brandFindManyMock },
  },
}));
vi.mock("@/lib/cloudinary", () => ({ getCloudinaryClient: vi.fn() }));
// Pas de cache Next en test : on appelle directement le loader.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Hiboutik — SKU de secours HB-<id>", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("HIBOUTIK_ACCOUNT", "boutique");
    vi.stubEnv("HIBOUTIK_USER", "user");
    vi.stubEnv("HIBOUTIK_API_KEY", "key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renvoie directement l'id Hiboutik, sans recherche code-barres", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { findHiboutikProductId } = await import("../hiboutik");

    await expect(findHiboutikProductId("HB-42")).resolves.toBe(42);
    await expect(findHiboutikProductId("hb-7")).resolves.toBe(7);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Mondial Relay — pas de faux relais en production", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("MONDIAL_RELAY_API_URL", "");
    vi.stubEnv("MONDIAL_RELAY_API_KEY", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("échoue en production quand le fournisseur n'est pas configuré", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MONDIAL_RELAY_USE_MOCK", "");
    const { searchRelayPoints } = await import("../mondial-relay");

    await expect(
      searchRelayPoints({ postalCode: "75001", city: "Paris" }),
    ).rejects.toThrow("MONDIAL_RELAY_NOT_CONFIGURED");
  });

  it("sert encore les relais de démo quand c'est explicitement demandé", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MONDIAL_RELAY_USE_MOCK", "true");
    const { searchRelayPoints } = await import("../mondial-relay");

    const result = await searchRelayPoints({
      postalCode: "75001",
      city: "Paris",
    });
    expect(result.source).toBe("mock");
  });
});

describe("Catégories — filtre Type appliqué AVANT la pagination", () => {
  beforeEach(() => {
    vi.resetModules();
    productFindManyMock.mockReset();
    productAggregateMock.mockReset();
    categoryFindUniqueMock.mockReset();
    categoryFindManyMock.mockReset();
    categoryFindManyMock.mockResolvedValue([]);
    brandFindManyMock.mockReset();
  });

  it("remplit la page et compte le bon total", async () => {
    categoryFindUniqueMock.mockResolvedValue({
      id: "cat-bijou",
      name: "Bijouterie",
      slug: "bijouterie",
      parent: null,
    });
    productAggregateMock.mockResolvedValue({
      _min: { price: 1000 },
      _max: { price: 5000 },
    });
    brandFindManyMock.mockResolvedValue([]);

    // 30 produits : 23 colliers et 7 bracelets, mélangés.
    const candidates = Array.from({ length: 30 }, (_, i) => ({
      id: `p${i}`,
      name: i % 4 === 3 ? `Bracelet ${i}` : `Collier ${i}`,
      tags: [],
      price: 2000,
      salePrice: null,
    }));
    const colliers = candidates.filter((p) => p.name.startsWith("Collier"));
    expect(colliers).toHaveLength(23);

    productFindManyMock.mockImplementation(
      async (args: { where: { id?: { in: string[] } } }) => {
        if (args.where.id?.in) {
          return args.where.id.in.map((id) => ({
            id,
            slug: id,
            name: "Collier",
            description: "",
            price: 2000,
            salePrice: null,
            images: [],
            stock: 1,
            status: "ACTIVE",
            isNew: false,
            tags: [],
            brandId: "b",
            categoryId: "cat-bijou",
            color: null,
            createdAt: new Date(),
            variants: [],
          }));
        }
        return candidates;
      },
    );

    const { getCategoryListing } = await import("../category-listing");
    const input = {
      slug: "bijouterie",
      brands: [],
      color: null,
      minPrice: null,
      maxPrice: null,
      groups: { type: "collier", pieces: null },
    };

    const page1 = await getCategoryListing({ ...input, page: 1 });
    expect(page1?.products).toHaveLength(20);
    expect(page1?.totalProducts).toBe(23);
    expect(page1?.totalPages).toBe(2);
    expect(page1?.products[0].id).toBe(colliers[0].id);

    const page2 = await getCategoryListing({ ...input, page: 2 });
    expect(page2?.products.map((p) => p.id)).toEqual(
      colliers.slice(20).map((p) => p.id),
    );
  });
});
