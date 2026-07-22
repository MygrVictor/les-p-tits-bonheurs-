import { describe, expect, it, vi, beforeEach } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stockMovement: {
      create: createMock,
    },
  },
}));

describe("backoffice/stock", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("computes available stock with floor at 0", async () => {
    const { getAvailableStock } = await import("../../backoffice/stock");
    expect(getAvailableStock(10, 3)).toBe(7);
    expect(getAvailableStock(2, 5)).toBe(0);
  });

  it("writes stock movement when model exists", async () => {
    const { appendStockMovement } = await import("../../backoffice/stock");
    await appendStockMovement({
      productId: "p1",
      quantity: 2,
      type: "SALE",
      source: "WEBSITE",
      reference: "CMD-1",
      comment: "ok",
      userId: "u1",
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        productId: "p1",
        quantity: 2,
        type: "SALE",
        source: "WEBSITE",
        reference: "CMD-1",
        comment: "ok",
        userId: "u1",
      },
    });
  });
});
