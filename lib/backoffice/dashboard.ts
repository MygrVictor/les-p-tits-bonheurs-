import { prisma } from "@/lib/prisma";

export async function getAdminDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    totalOrders,
    totalClients,
    totalBrands,
    totalCategories,
    revenueAgg,
    monthlyRevenueAgg,
    recentOrders,
    recentProducts,
    topSellingRaw,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 10,
      select: { id: true, name: true, stock: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.product.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, stock: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
  ]);

  const productMap = new Map(
    (
      await prisma.product.findMany({
        where: { id: { in: topSellingRaw.map((entry) => entry.productId) } },
        select: { id: true, name: true },
      })
    ).map((product) => [product.id, product.name]),
  );

  const topSelling = topSellingRaw.map((entry) => ({
    productId: entry.productId,
    productName: productMap.get(entry.productId) ?? "Produit supprimé",
    quantity: entry._sum.quantity ?? 0,
  }));

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const monthlyRevenue = monthlyRevenueAgg._sum.total ?? 0;
  const averageCart =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    totals: {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalOrders,
      totalClients,
      totalBrands,
      totalCategories,
      totalSuppliers: 0,
      totalRevenue,
      monthlyRevenue,
      averageCart,
    },
    recentOrders,
    recentProducts,
    topSelling,
    lowStockProducts,
  };
}
