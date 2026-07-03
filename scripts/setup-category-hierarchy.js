const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hierarchyData = [
  {
    name: "Bijoux",
    slug: "bijoux",
    subCategories: [
      { name: "Acier inoxydable", slug: "bijoux-acier-inoxydable" },
      { name: "Plaqué or", slug: "bijoux-plaque-or" },
      { name: "Collier", slug: "bijoux-collier" },
      { name: "Bracelet", slug: "bijoux-bracelet" },
      { name: "Boucles d'oreilles", slug: "bijoux-boucles" },
    ],
  },
  {
    name: "Perlerie",
    slug: "perlerie",
    subCategories: [
      { name: "Perles", slug: "perlerie-perles" },
      { name: "Charms", slug: "perlerie-charms" },
      { name: "Apprêts", slug: "perlerie-apprêts" },
      { name: "Chaînes", slug: "perlerie-chaines" },
      { name: "Fils", slug: "perlerie-fils" },
      { name: "Outils", slug: "perlerie-outils" },
      { name: "Kits DIY", slug: "perlerie-kits-diy" },
    ],
  },
  {
    name: "DIY & Loisirs créatifs",
    slug: "diy-loisirs-creatifs",
    subCategories: [
      { name: "Kits créatifs", slug: "diy-kits-creatifs" },
      { name: "Puzzles", slug: "diy-puzzles" },
      { name: "Loisirs créatifs", slug: "diy-loisirs" },
    ],
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    subCategories: [
      { name: "Lunettes", slug: "lifestyle-lunettes" },
      { name: "Foulards", slug: "lifestyle-foulards" },
      { name: "Accessoires", slug: "lifestyle-accessoires" },
      { name: "Maroquinerie", slug: "lifestyle-maroquinerie" },
      { name: "Sacs", slug: "lifestyle-sacs" },
    ],
  },
  {
    name: "Décoration & Maison",
    slug: "decoration-et-maison",
    subCategories: [
      { name: "Art de la table", slug: "deco-art-table" },
      { name: "Décoration", slug: "deco-decoration" },
      { name: "Gourdes & isothermes", slug: "deco-gourdes" },
    ],
  },
  {
    name: "Papeterie",
    slug: "papeterie",
    subCategories: [
      { name: "Carnets", slug: "papeterie-carnets" },
      { name: "Notes", slug: "papeterie-notes" },
      { name: "Humours", slug: "papeterie-humours" },
    ],
  },
  {
    name: "Acheter par couleur",
    slug: "couleurs",
    subCategories: [
      { name: "Rose", slug: "couleur-rose" },
      { name: "Vert", slug: "couleur-vert" },
      { name: "Bleu", slug: "couleur-bleu" },
      { name: "Doré", slug: "couleur-dore" },
    ],
  },
  {
    name: "Coups de cœur Pauline",
    slug: "coups-de-coeur",
    subCategories: [{ name: "Sélection Pauline", slug: "pauline-selection" }],
  },
];

(async () => {
  for (const parent of hierarchyData) {
    // Create or get parent category
    const parentCat = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { name: parent.name, slug: parent.slug },
    });

    // Create sub-categories
    for (const sub of parent.subCategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parentCat.id },
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: parentCat.id,
        },
      });
    }
  }

  console.log(
    "✓ Category hierarchy created successfully with",
    hierarchyData.length,
    "parent categories",
  );

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Error:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
