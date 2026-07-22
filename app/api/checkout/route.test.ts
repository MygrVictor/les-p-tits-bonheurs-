import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();
const authMock = vi.fn();
const createSessionMock = vi.fn();
const encodeCartMetadataMock = vi.fn(() => ({
  itemsChunks: "1",
  items_0: "[]",
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findFirst: findFirstMock,
    },
  },
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: createSessionMock,
      },
    },
  }),
}));
vi.mock("@/lib/checkout", () => ({
  encodeCartMetadata: encodeCartMetadataMock,
}));

const validBody = {
  items: [{ productId: "prod-1", variantId: null, quantity: 1 }],
  firstName: "Nina",
  lastName: "Lemoine",
  email: "client@example.com",
  address: "10 rue des Fleurs",
  postalCode: "75001",
  city: "Paris",
  shippingCountry: "FR",
};

function activeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-1",
    slug: "prod-1",
    name: "Bracelet Acier",
    price: 2500,
    salePrice: null,
    stock: 5,
    status: "ACTIVE",
    images: ["https://images.example.com/a.jpg"],
    variants: [],
    ...overrides,
  };
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstMock.mockReset();
    authMock.mockReset();
    createSessionMock.mockReset();
    encodeCartMetadataMock.mockClear();
    authMock.mockResolvedValue(null);
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      body: "{",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid payload", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unsupported shipping country", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validBody, shippingCountry: "ZZ" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when product is unavailable", async () => {
    findFirstMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when stock is insufficient", async () => {
    findFirstMock.mockResolvedValue(activeProduct({ stock: 0 }));
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when Stripe session creation fails", async () => {
    findFirstMock.mockResolvedValue(activeProduct());
    createSessionMock.mockRejectedValue(new Error("stripe down"));
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://shop.example.com",
      },
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns Stripe checkout URL on success", async () => {
    findFirstMock.mockResolvedValue(activeProduct());
    createSessionMock.mockResolvedValue({
      url: "https://checkout.stripe.test/s/1",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://shop.example.com",
      },
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.test/s/1");
    expect(encodeCartMetadataMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledTimes(1);
  });
});
