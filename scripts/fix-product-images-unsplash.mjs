/**
 * scripts/fix-product-images-unsplash.mjs
 * Utilise l'API Unsplash standard pour générer des URLs d'images stables
 * au lieu de source.unsplash.com qui peut être bloqué
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping des noms de produits à des search IDs Unsplash
// Format: https://images.unsplash.com/photo-ID?w=600&h=600&fit=crop
// Ces IDs sont basés sur des photos existantes qui correspondent au produit
const unsplashPhotoIds = {
  collier: [
    "5FPu6bAwoi0", // necklace
    "PfMUb-OMT5E", // jewelry
    "T5QrWLUQOAM", // necklace
  ],
  bracelet: [
    "yb-aQk5j4fU", // bracelet
    "7jRVMqXMqhs", // jewelry
    "rRJR_lWQgxw", // bracelet
  ],
  boucles: [
    "TXVZSN7gYFU", // earrings
    "e6r-XfqhVGo", // earrings
    "L2Z3bUE9faY", // jewelry
  ],
  bague: [
    "SAiVUkDz8z8", // ring
    "MQUqbmHsYIU", // ring
    "T5QrWLUQOAM", // jewelry
  ],
  puzzle: [
    "3V8xY1q6riw", // puzzle
    "_eKMN9QRoIw", // puzzle
    "c_Zw2lXMZ4k", // puzzle
  ],
  peinture: [
    "xW3B1K351-4", // painting
    "rN_n2AKwq-c", // art
    "RYEhNqZWxLw", // painting
  ],
  diamond: [
    "Wq0UZzVq2Ks", // craft
    "9Pm8PvVv7fI", // DIY
    "RXBK-YLRP0I", // craft
  ],
  foulard: [
    "3kHnQb5CTW8", // scarf
    "RP_zKEg3oCQ", // fashion
    "aN2Zg8oGfzo", // accessories
  ],
  chaussettes: [
    "kmKUT4D5vAI", // socks
    "xB9IjkSxU98", // clothing
    "T_kwsE3LJ0o", // fashion
  ],
  trousse: [
    "nss2eG47bdQ", // cosmetics
    "x2xQy6PS-fE", // pouch
    "6J--NeFQeIE", // bag
  ],
  papeterie: [
    "Ky2VzT53fQI", // stationery
    "3U2V5BJ7sNs", // notebook
    "8PxPJm32Jqw", // stationery
  ],
  candle: [
    "kBQjwCR8h6c", // candles
    "lAR9EfEPlRw", // candle
    "ZekPljhx_5I", // home
  ],
  aquarelle: [
    "rN_n2AKwq-c", // art
    "xW3B1K351-4", // painting
    "cBLEv97A_yE", // watercolor
  ],
};

function getUnsplashPhotoUrl(keywords, seed) {
  // Fallback simple: utiliser Cloudinary placeholder ou un service stable
  // Alternativement, utiliser Picsum photos qui est stable
  // Pour éviter les problèmes, on utilise une image placeholder
  return `https://images.unsplash.com/photo-SAiVUkDz8z8?w=600&h=600&fit=crop&q=80`;
}

async function fixProductImages() {
  console.log("⏳ Correction des images des produits...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  let updated = 0;

  for (const product of products) {
    // Générer une image stable basée sur Unsplash
    // Utiliser des IDs de photos réelles
    let photoId = "xW3B1K351-4"; // Défaut

    const name = product.name.toLowerCase();
    if (name.includes("collier")) photoId = "5FPu6bAwoi0";
    else if (name.includes("bracelet")) photoId = "yb-aQk5j4fU";
    else if (
      name.includes("boucles") ||
      name.includes("créoles") ||
      name.includes("pendantes")
    )
      photoId = "TXVZSN7gYFU";
    else if (name.includes("bague") || name.includes("anneau"))
      photoId = "SAiVUkDz8z8";
    else if (name.includes("puzzle")) photoId = "3V8xY1q6riw";
    else if (name.includes("peinture")) photoId = "xW3B1K351-4";
    else if (name.includes("diamond")) photoId = "Wq0UZzVq2Ks";
    else if (name.includes("aquarelle")) photoId = "rN_n2AKwq-c";
    else if (name.includes("pastel")) photoId = "xW3B1K351-4";
    else if (name.includes("kit")) photoId = "Wq0UZzVq2Ks";
    else if (name.includes("foulard")) photoId = "3kHnQb5CTW8";
    else if (name.includes("chaussettes")) photoId = "kmKUT4D5vAI";
    else if (name.includes("trousse")) photoId = "nss2eG47bdQ";
    else if (name.includes("papeterie")) photoId = "Ky2VzT53fQI";
    else if (name.includes("bougie")) photoId = "kBQjwCR8h6c";

    const newImage = `https://images.unsplash.com/photo-${photoId}?w=600&h=600&fit=crop&q=80`;

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: [newImage],
        },
      });
      updated++;
      console.log(`✓ ${product.name}`);
    } catch (error) {
      console.error(`✗ Erreur pour ${product.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${updated}/${products.length} produits mis à jour`);
}

fixProductImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
