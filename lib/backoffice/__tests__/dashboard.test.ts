import { beforeEach, describe, expect, it, vi } from "vitest";

const productCountMock = vi.fn();
const productFindManyMock = vi.fn();
const orderCountMock = vi.fn();
const userCountMock = vi.fn();
const brandCountMock = vi.fn();
const categoryCountMock = vi.fn();
const orderAggregateMock = vi.fn();
const orderFindManyMock = vi.fn();
const orderItemGroupByMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      count: productCountMock,
      findMany: productFindManyMock,
    },
    order: {
      count: orderCountMock,
      aggregate: orderAggregateMock,
      findMany: orderFindManyMock,
    },
    user: { count: userCountMock },
    brand: { count: brandCountMock },
    category: { count: categoryCountMock },
    orderItem: { groupBy: orderItemGroupByMock },
  },
}));

describe("backoffice dashboard", () => {
  beforeEach(() => {
    vi.resetModules();
    productCountMock.mockReset();
    productFindManyMock.mockReset();
    orderCountMock.mockReset();
    userCountMock.mockReset();
    brandCountMock.mockReset();
    categoryCountMock.mockReset();
    orderAggregateMock.mockReset();
    orderFindManyMock.mockReset();
    orderItemGroupByMock.mockReset();
  });

  it("returns computed dashboard totals and top selling labels", async () => {
    productCountMock
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(4);

    productFindManyMock
      .mockResolvedValueOnce([{ id: "p1", name: "A", stock: 2 }])
      .mockResolvedValueOnce([
        { id: "p2", name: "B", stock: 1, createdAt: new Date() },
      ])
      .mockResolvedValueOnce([{ id: "p10", name: "Collier Lune" }]);

    orderCountMock.mockResolvedValue(10);
    userCountMock.mockResolvedValue(45);
    brandCountMock.mockResolvedValue(9);
    categoryCountMock.mockResolvedValue(7);
    orderAggregateMock
      .mockResolvedValueOnce({ _sum: { total: 50000 } })
      .mockResolvedValueOnce({ _sum: { total: 12000 } });
    orderFindManyMock.mockResolvedValue([{ id: "o1", total: 1200 }]);
    orderItemGroupByMock.mockResolvedValue([
      { productId: "p10", _sum: { quantity: 12 } },
      { productId: "p404", _sum: { quantity: 3 } },
    ]);

    const { getAdminDashboardData } =
      await import("../../backoffice/dashboard");
    const data = await getAdminDashboardData();

    expect(data.totals.totalProducts).toBe(100);
    expect(data.totals.activeProducts).toBe(80);
    expect(data.totals.outOfStockProducts).toBe(4);
    expect(data.totals.totalOrders).toBe(10);
    expect(data.totals.totalRevenue).toBe(50000);
    expect(data.totals.monthlyRevenue).toBe(12000);
    expect(data.totals.averageCart).toBe(5000);
    expect(data.topSelling[0].productName).toBe("Collier Lune");
    expect(data.topSelling[1].productName).toBe("Produit supprimé");
  });
});
