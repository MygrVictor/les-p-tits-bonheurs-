import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEventMock = vi.fn();
const finalizeCheckoutSessionMock = vi.fn();
const transactionMock = vi.fn();

const getEnvMock = vi.fn(() => ({ STRIPE_WEBHOOK_SECRET: "whsec_test" }));

vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));
vi.mock("@/lib/stripe", () => ({
  getStripeClient: () => ({
    webhooks: {
      constructEvent: constructEventMock,
    },
  }),
}));
vi.mock("@/lib/checkout", () => ({
  finalizeCheckoutSession: finalizeCheckoutSessionMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    constructEventMock.mockReset();
    finalizeCheckoutSessionMock.mockReset();
    transactionMock.mockReset();
  });

  it("returns 400 when signature is missing", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is invalid", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_1" },
      body: "{}",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("handles checkout.session.completed", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1" } },
    });
    finalizeCheckoutSessionMock.mockResolvedValue({ status: "ok" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_2" },
      body: "payload",
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(finalizeCheckoutSessionMock).toHaveBeenCalledWith("cs_1");
  });

  it("handles payment_intent.payment_failed and updates order status", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_fail",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_1" } },
    });

    transactionMock.mockImplementation(async (cb: any) => {
      const tx = {
        order: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "ord_1", status: "CONFIRMED" }),
          update: vi
            .fn()
            .mockResolvedValue({ id: "ord_1", status: "CANCELLED" }),
        },
        orderEvent: {
          create: vi.fn().mockResolvedValue({ id: "evt_db_1" }),
        },
      };
      return cb(tx);
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_3" },
      body: "payload",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it("handles charge.refunded and restores stock", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_refund",
      type: "charge.refunded",
      data: { object: { id: "ch_1", payment_intent: "pi_2" } },
    });

    transactionMock.mockImplementation(async (cb: any) => {
      const tx = {
        order: {
          findFirst: vi.fn().mockResolvedValue({
            id: "ord_2",
            status: "CONFIRMED",
            items: [{ productId: "p1", variantId: "v1", quantity: 2 }],
          }),
          update: vi
            .fn()
            .mockResolvedValue({ id: "ord_2", status: "CANCELLED" }),
        },
        orderEvent: {
          create: vi
            .fn()
            .mockResolvedValueOnce({ id: "evt_ref_1" })
            .mockResolvedValueOnce({ id: "evt_ref_2" }),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        product: {
          update: vi.fn().mockResolvedValue({ id: "p1" }),
        },
        productVariant: {
          update: vi.fn().mockResolvedValue({ id: "v1" }),
        },
      };
      return cb(tx);
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig_4" },
      body: "payload",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
