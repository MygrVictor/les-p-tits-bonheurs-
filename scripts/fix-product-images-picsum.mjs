/**
 * scripts/fix-product-images-picsum.mjs
 * Utilise Picsum Photos (déjà configuré dans next.config)
 * avec des seeds cohérents basés sur le nom du produit
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function picsumUrl(seed) {
  return `https://picsum.photos/seed/${seed}/600/600`;
}

async function fixProductImages() {
  console.log("⏳ Correction des images des produits avec Picsum...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  let updated = 0;

  for (const product of products) {
    const name = product.name.toLowerCase();
    // Utiliser le nom du produit comme seed pour Picsum
    // Cela garantit que la même image est toujours retournée pour le même produit
    const seed = name.replace(/[^a-z0-9]/g, "").substring(0, 20);
    const newImage = picsumUrl(seed);

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: [newImage],
        },
      });
      updated++;
      console.log(`✓ ${product.name} → ${seed}`);
    } catch (error) {
      console.error(`✗ Erreur pour ${product.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${updated}/${products.length} produits mis à jour`);
}

fixProductImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
