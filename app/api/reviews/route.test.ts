import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const reviewFindManyMock = vi.fn();
const reviewFindFirstMock = vi.fn();
const reviewCreateMock = vi.fn();
const productFindFirstMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      findMany: reviewFindManyMock,
      findFirst: reviewFindFirstMock,
      create: reviewCreateMock,
    },
    product: {
      findFirst: productFindFirstMock,
    },
  },
}));

describe("/api/reviews", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    reviewFindManyMock.mockReset();
    reviewFindFirstMock.mockReset();
    reviewCreateMock.mockReset();
    productFindFirstMock.mockReset();
  });

  it("GET requires productId", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/reviews"));
    expect(res.status).toBe(400);
  });

  it("GET returns approved reviews", async () => {
    reviewFindManyMock.mockResolvedValue([{ id: "r1" }]);
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/reviews?productId=p1"),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.reviews).toHaveLength(1);
  });

  it("POST requires auth", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("POST validates payload and product existence", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    const { POST } = await import("./route");

    let res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 6 }),
      }),
    );
    expect(res.status).toBe(400);

    productFindFirstMock.mockResolvedValue(null);
    res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: "p1",
          rating: 5,
          comment: "Excellent produit artisanal vraiment top.",
        }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("POST blocks duplicate review and allows first submission", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    productFindFirstMock.mockResolvedValue({ id: "p1" });

    const { POST } = await import("./route");
    reviewFindFirstMock.mockResolvedValueOnce({ id: "existing" });
    let res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: "p1",
          rating: 4,
          comment: "Très joli, finition soignée et durable.",
        }),
      }),
    );
    expect(res.status).toBe(409);

    reviewFindFirstMock.mockResolvedValueOnce(null);
    reviewCreateMock.mockResolvedValue({ id: "r2" });
    res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: "p1",
          rating: 4,
          comment: "Très joli, finition soignée et durable.",
        }),
      }),
    );
    expect(res.status).toBe(201);
  });
});
