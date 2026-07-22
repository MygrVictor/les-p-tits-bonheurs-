import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const wishlistFindManyMock = vi.fn();
const wishlistUpsertMock = vi.fn();
const wishlistDeleteManyMock = vi.fn();
const productFindFirstMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishlistItem: {
      findMany: wishlistFindManyMock,
      upsert: wishlistUpsertMock,
      deleteMany: wishlistDeleteManyMock,
    },
    product: {
      findFirst: productFindFirstMock,
    },
  },
}));

describe("/api/wishlist", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    wishlistFindManyMock.mockReset();
    wishlistUpsertMock.mockReset();
    wishlistDeleteManyMock.mockReset();
    productFindFirstMock.mockReset();
  });

  it("GET returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns wishlist items", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    wishlistFindManyMock.mockResolvedValue([{ id: "w1" }]);
    const { GET } = await import("./route");
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(1);
  });

  it("POST validates body and missing product", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    const { POST } = await import("./route");

    let res = await POST(
      new Request("http://localhost/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);

    productFindFirstMock.mockResolvedValue(null);
    res = await POST(
      new Request("http://localhost/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: "missing" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("POST upserts wishlist item", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    productFindFirstMock.mockResolvedValue({ id: "p1" });
    wishlistUpsertMock.mockResolvedValue({ id: "w1" });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: "p1" }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it("DELETE validates productId and removes item", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    const { DELETE } = await import("./route");

    let res = await DELETE(new Request("http://localhost/api/wishlist"));
    expect(res.status).toBe(400);

    wishlistDeleteManyMock.mockResolvedValue({ count: 1 });
    res = await DELETE(
      new Request("http://localhost/api/wishlist?productId=p1"),
    );
    expect(res.status).toBe(200);
  });
});
