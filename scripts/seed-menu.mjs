import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Arborescence alignée avec lib/menu.ts (menu principal, juillet 2026).
// Chaque entrée racine peut avoir des `children` (2e niveau, géré par
// l'admin actuel). Voir aussi scripts/restructure-menu-2026.mjs pour la
// migration équivalente sur une base déjà peuplée avec l'ancienne structure.
const categoryTree = [
  {
    name: "Bijouterie",
    slug: "bijouterie",
    children: [
      { name: "Acier inoxydable", slug: "bijouterie-acier-inoxydable" },
      { name: "Plaqué Or", slug: "bijouterie-plaque-or" },
    ],
  },
  { name: "Perlerie", slug: "perlerie" },
  {
    name: "Jeux & DIY",
    slug: "jeux-diy",
    children: [
      { name: "Puzzles", slug: "jeux-diy-puzzles" },
      { name: "Jeux", slug: "jeux-diy-jeux" },
      { name: "Peinture au numéro", slug: "jeux-diy-peinture-au-numero" },
      { name: "Diamond Painting", slug: "jeux-diy-diamond-painting" },
      { name: "Carnets à aquarelle", slug: "jeux-diy-carnets-aquarelle" },
      { name: "Pastels", slug: "jeux-diy-pastels" },
      { name: "Kits DIY", slug: "jeux-diy-kits-diy" },
      { name: "Kits bijoux", slug: "jeux-diy-kits-bijoux" },
    ],
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    children: [
      { name: "Maroquinerie", slug: "lifestyle-maroquinerie" },
      { name: "Accessoires cheveux", slug: "lifestyle-accessoires-cheveux" },
      { name: "Foulards & Bandeaux", slug: "lifestyle-foulards-bandeaux" },
      { name: "Chaussettes", slug: "lifestyle-chaussettes" },
      { name: "Pin's", slug: "lifestyle-pins" },
      { name: "Trousses de toilette", slug: "lifestyle-trousses-toilette" },
    ],
  },
  {
    name: "Décoration & Maison",
    slug: "decoration-maison",
    children: [
      { name: "Arts de la table", slug: "decoration-maison-arts-table" },
      { name: "Bougies", slug: "decoration-maison-bougies" },
      { name: "Décoration murale", slug: "decoration-maison-murale" },
    ],
  },
  { name: "Papeterie", slug: "papeterie" },
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

let categoryCount = 0;

for (const root of categoryTree) {
  const parent = await prisma.category.upsert({
    where: { slug: root.slug },
    update: { name: root.name },
    create: { name: root.name, slug: root.slug },
  });
  categoryCount += 1;

  for (const child of root.children ?? []) {
    await prisma.category.upsert({
      where: { slug: child.slug },
      update: { name: child.name, parentId: parent.id },
      create: { name: child.name, slug: child.slug, parentId: parent.id },
    });
    categoryCount += 1;
  }
}

for (const brand of brands) {
  await prisma.brand.upsert({
    where: { slug: brand.slug },
    update: { name: brand.name },
    create: brand,
  });
}

console.log("OK seeded menu categories/brands", {
  categories: categoryCount,
  brands: brands.length,
});

await prisma.$disconnect();
