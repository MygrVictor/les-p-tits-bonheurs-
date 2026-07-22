import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieveMock = vi.fn();
const findUniqueMock = vi.fn();
const transactionMock = vi.fn();
const sendOrderConfirmationMock = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        retrieve: retrieveMock,
      },
    },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    order: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/order-notifications", () => ({
  sendOrderConfirmation: sendOrderConfirmationMock,
}));

describe("finalizeCheckoutSession", () => {
  beforeEach(() => {
    vi.resetModules();
    retrieveMock.mockReset();
    findUniqueMock.mockReset();
    transactionMock.mockReset();
    sendOrderConfirmationMock.mockReset();
  });

  it("returns invalid when session id is missing", async () => {
    const { finalizeCheckoutSession } = await import("../checkout");
    await expect(finalizeCheckoutSession(null)).resolves.toEqual({
      status: "invalid",
    });
  });

  it("returns invalid when stripe retrieval fails", async () => {
    retrieveMock.mockRejectedValue(new Error("not found"));
    const { finalizeCheckoutSession } = await import("../checkout");
    await expect(finalizeCheckoutSession("cs_1")).resolves.toEqual({
      status: "invalid",
    });
  });

  it("returns existing order when already finalized", async () => {
    retrieveMock.mockResolvedValue({ id: "cs_existing" });
    findUniqueMock.mockResolvedValue({
      id: "ord_1",
      total: 3200,
      status: "CONFIRMED",
      createdAt: new Date("2026-01-01"),
      user: { email: "client@example.com" },
      items: [{ quantity: 2, price: 1600, product: { name: "Bracelet" } }],
    });

    const { finalizeCheckoutSession } = await import("../checkout");
    const result = await finalizeCheckoutSession("cs_existing");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.order.id).toBe("ord_1");
      expect(result.order.items[0].productName).toBe("Bracelet");
    }
  });

  it("returns unpaid when payment status is not paid", async () => {
    retrieveMock.mockResolvedValue({ id: "cs_2", payment_status: "unpaid" });
    findUniqueMock.mockResolvedValue(null);

    const { finalizeCheckoutSession } = await import("../checkout");
    await expect(finalizeCheckoutSession("cs_2")).resolves.toEqual({
      status: "unpaid",
    });
  });

  it("returns invalid when paid but email or metadata cart is missing", async () => {
    findUniqueMock.mockResolvedValue(null);
    retrieveMock.mockResolvedValue({
      id: "cs_3",
      payment_status: "paid",
      customer_details: null,
      metadata: {},
    });

    const { finalizeCheckoutSession } = await import("../checkout");
    await expect(finalizeCheckoutSession("cs_3")).resolves.toEqual({
      status: "invalid",
    });

    retrieveMock.mockResolvedValue({
      id: "cs_4",
      payment_status: "paid",
      customer_details: { email: "client@example.com" },
      metadata: { itemsChunks: "abc" },
    });
    await expect(finalizeCheckoutSession("cs_4")).resolves.toEqual({
      status: "invalid",
    });
  });

  it("creates order through transaction when session is paid and valid", async () => {
    findUniqueMock.mockResolvedValue(null);
    retrieveMock.mockResolvedValue({
      id: "cs_paid",
      payment_status: "paid",
      amount_total: 3000,
      customer_details: {
        email: "Client@Example.com",
        name: "Nina",
      },
      shipping_details: null,
      metadata: {
        itemsChunks: "1",
        items_0: JSON.stringify([
          {
            productId: "p1",
            variantId: null,
            quantity: 2,
            price: 1500,
            name: "Bracelet",
          },
        ]),
      },
      payment_intent: "pi_1",
    });

    transactionMock.mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: "ord_new",
            total: 3000,
            status: "CONFIRMED",
            createdAt: new Date("2026-02-01"),
            user: { email: "client@example.com" },
            items: [
              {
                quantity: 2,
                price: 1500,
                product: { name: "Bracelet" },
              },
            ],
          }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "u1",
            email: "client@example.com",
            emailVerifiedAt: new Date(),
            name: "Nina",
            address: null,
          }),
          create: vi.fn(),
          update: vi.fn(),
        },
        product: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "p1", stock: 5, status: "ACTIVE" }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        productVariant: {
          findFirst: vi.fn(),
          updateMany: vi.fn(),
        },
        orderEvent: {
          create: vi.fn().mockResolvedValue({ id: "evt_1" }),
        },
      };

      return callback(tx);
    });

    const { finalizeCheckoutSession } = await import("../checkout");
    const result = await finalizeCheckoutSession("cs_paid");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.order.id).toBe("ord_new");
      expect(result.order.email).toBe("client@example.com");
    }
    expect(sendOrderConfirmationMock).toHaveBeenCalledTimes(1);
    expect(sendOrderConfirmationMock.mock.calls[0][0]).toMatchObject({
      email: "client@example.com",
      orderId: "ord_new",
      total: 3000,
    });
  });
});
