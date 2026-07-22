/**
 * scripts/update-product-images.mjs
 * Met à jour les images des produits existants avec des recherches Unsplash sémantiques
 * au lieu des images aléatoires Picsum.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping des noms de produits à des recherches Unsplash sémantiques
const productImageMaps = {
  collier: "necklace jewelry",
  bracelet: "bracelet jewelry",
  boucles: "earrings jewelry",
  bague: "ring jewelry",
  jonc: "bracelet jewelry",
  créoles: "earrings jewelry",
  pendantes: "earrings jewelry",
  anneau: "ring jewelry",
  chaîne: "necklace jewelry",
  sautoir: "necklace jewelry",
  perles: "beads pearls",
  kit: "craft DIY supplies",
  puzzle: "puzzle game jigsaw",
  peinture: "painting art watercolor",
  diamond: "diamond painting craft",
  aquarelle: "watercolor painting art",
  pastels: "pastel art supplies",
  "carnet aquarelle": "sketchbook watercolor",
  bougies: "candles",
  trousse: "pouch cosmetics toiletry",
  foulard: "scarf fashion",
  bandeau: "headband accessory",
  cheveux: "hair accessories clips",
  maroquinerie: "leather bag wallet",
  chaussettes: "socks",
  pins: "pins buttons badges",
  "arts table": "tableware dishes",
  murale: "wall art decor",
  papeterie: "stationery notebooks",
};

async function updateProductImages() {
  console.log("⏳ Mise à jour des images des produits...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  let updated = 0;

  for (const product of products) {
    // Trouver les mots-clés pertinents basés sur le nom du produit
    let keywords = "jewelry product";

    for (const [keyword, search] of Object.entries(productImageMaps)) {
      if (product.name.toLowerCase().includes(keyword)) {
        keywords = search;
        break;
      }
    }

    // Générer l'URL Unsplash
    const query = keywords.replace(/[^a-z0-9]/gi, ",");
    const seed = product.id.substring(0, 8); // Utiliser les 8 premiers caractères de l'ID pour la seed
    const newImage = `https://source.unsplash.com/600x600/?${query}&sig=lpb${seed}`;

    // Mettre à jour le produit
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: [newImage],
        },
      });
      updated++;
      console.log(`✓ ${product.name}: ${keywords}`);
    } catch (error) {
      console.error(`✗ Erreur pour ${product.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${updated}/${products.length} produits mis à jour`);
}

updateProductImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
