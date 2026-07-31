/**
 * clean-db.mjs
 * Supprime le catalogue produits + l'historique de commandes
 * pour livrer un site vierge.
 *
 * Conserve : utilisateurs (dont admin), catégories, marques.
 *
 * Note : on supprime d'abord les dépendances pour respecter les contraintes FK.
 *
 * Usage: node scripts/clean-db.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Nettoyage produits + commandes...");

  // Historique commandes
  const { count: orderEventsDeleted } = await prisma.orderEvent.deleteMany({});
  console.log(`  ✓ OrderEvent supprimés   : ${orderEventsDeleted}`);

  const { count: orderItemsDeleted } = await prisma.orderItem.deleteMany({});
  console.log(`  ✓ OrderItem supprimés    : ${orderItemsDeleted}`);

  const { count: ordersDeleted } = await prisma.order.deleteMany({});
  console.log(`  ✓ Order supprimées       : ${ordersDeleted}`);

  // Dépendances directes du produit
  const { count: wishlistDeleted } = await prisma.wishlistItem.deleteMany({});
  console.log(`  ✓ WishlistItem supprimés : ${wishlistDeleted}`);

  const { count: reviewsDeleted } = await prisma.review.deleteMany({});
  console.log(`  ✓ Review supprimés       : ${reviewsDeleted}`);

  const { count: stonesDeleted } = await prisma.stone.deleteMany({});
  console.log(`  ✓ Stone supprimés        : ${stonesDeleted}`);

  const { count: variantsDeleted } = await prisma.productVariant.deleteMany({});
  console.log(`  ✓ ProductVariant supprimés : ${variantsDeleted}`);

  const { count: productsDeleted } = await prisma.product.deleteMany({});
  console.log(`  ✓ Product supprimés      : ${productsDeleted}`);

  console.log("✅ Site vierge de produits et de commandes.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant le nettoyage :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
