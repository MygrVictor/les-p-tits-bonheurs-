import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Perlerie", slug: "perlerie" },
  { name: "DIY & Loisirs créatifs", slug: "diy-loisirs-creatifs" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Idées cadeaux", slug: "idees-cadeaux" },
  { name: "Acheter par couleur", slug: "couleurs" },
  { name: "Coups de cœur Pauline", slug: "coups-de-coeur" },
];

const brands = [
  { name: "LA2L", slug: "la2l" },
  { name: "Au Fil de l'Eau", slug: "au-fil-de-leau" },
  { name: "Mya Bay", slug: "mya-bay" },
  { name: "Chloé Lou", slug: "chloe-lou" },
  { name: "Mayaaz", slug: "mayaaz" },
  { name: "Habaha", slug: "habaha" },
  { name: "La Petite Épicerie", slug: "la-petite-epicerie" },
  { name: "Piece & Love", slug: "piece-love" },
  { name: "Piecely", slug: "piecely" },
  { name: "All The Way To Say", slug: "all-the-way-to-say" },
  { name: "Charlie Therapy", slug: "charlie-therapy" },
  { name: "Bellemme", slug: "bellemme" },
  { name: "Les Belles Vagabondes", slug: "les-belles-vagabondes" },
  { name: "Coucou Suzette", slug: "coucou-suzette" },
  { name: "Récitem", slug: "recitem" },
  { name: "Paul Marius", slug: "paul-marius" },
  { name: "Crazy Lou", slug: "crazy-lou" },
  { name: "Rice", slug: "rice" },
  { name: "Kencre", slug: "kencre" },
  { name: "Letterbox", slug: "letterbox" },
  { name: "Carte d'Art", slug: "carte-dart" },
];

for (const category of categories) {
  await prisma.category.upsert({
    where: { slug: category.slug },
    update: { name: category.name },
    create: category,
  });
}

for (const brand of brands) {
  await prisma.brand.upsert({
    where: { slug: brand.slug },
    update: { name: brand.name },
    create: brand,
  });
}

console.log("OK seeded menu categories/brands", {
  categories: categories.length,
  brands: brands.length,
});

await prisma.$disconnect();
