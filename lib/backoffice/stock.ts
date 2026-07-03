import { prisma } from "@/lib/prisma";

export function getAvailableStock(
  stockPhysical: number,
  stockReserved: number,
): number {
  return Math.max(0, stockPhysical - stockReserved);
}

export async function appendStockMovement(params: {
  productId: string;
  quantity: number;
  type: "SALE" | "RETURN" | "RESTOCK" | "MANUAL_ADJUSTMENT" | "CANCELLATION";
  source: "WEBSITE" | "ADMIN" | "SUPPLIER" | "POS";
  reference?: string;
  comment?: string;
  userId?: string;
}) {
  // Compatible with current schema if the model is added/migrated later.
  // Intentionally guarded to avoid runtime crash before migration.
  const hasModel = (prisma as any).stockMovement;
  if (!hasModel) return;

  await (prisma as any).stockMovement.create({
    data: {
      productId: params.productId,
      quantity: params.quantity,
      type: params.type,
      source: params.source,
      reference: params.reference,
      comment: params.comment,
      userId: params.userId,
    },
  });
}
