import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const getEnvMock = vi.fn(() => ({
  RESEND_FROM: "noreply@boutique.example.com",
}));
const getResendClientMock = vi.fn(() => ({
  emails: {
    send: sendMock,
  },
}));

vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));
vi.mock("@/lib/resend", () => ({ getResendClient: getResendClientMock }));

describe("order-notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });

  it("sends shipping notification with tracking link", async () => {
    sendMock.mockResolvedValue({ data: { id: "mail_1" }, error: null });
    const { sendShippingNotification } = await import("../order-notifications");

    const ok = await sendShippingNotification({
      email: "client@example.com",
      orderId: "order_abcdef",
      carrier: "colissimo",
      trackingNumber: "TRACK123",
    });

    expect(ok).toBe(true);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toContain("expédiée");
    expect(payload.text).toContain("TRACK123");
    expect(payload.text).toContain("laposte.fr");
  });

  it("returns false when shipping email is rejected by API", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "reject" } });
    const { sendShippingNotification } = await import("../order-notifications");
    const ok = await sendShippingNotification({
      email: "client@example.com",
      orderId: "order_abcdef",
      carrier: "autre",
      trackingNumber: "X",
    });
    expect(ok).toBe(false);
  });

  it("sends order confirmation and handles exception", async () => {
    sendMock.mockRejectedValue(new Error("fail"));
    const { sendOrderConfirmation } = await import("../order-notifications");
    const ok = await sendOrderConfirmation({
      email: "client@example.com",
      orderId: "order_abcdef",
      total: 3500,
      items: [{ productName: "Bracelet", quantity: 2, price: 1500 }],
    });
    expect(ok).toBe(false);
  });
});
