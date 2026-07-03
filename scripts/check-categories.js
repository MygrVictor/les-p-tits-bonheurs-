const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" },
  });

  console.log("Categories structure:");
  categories.forEach((cat) => {
    const indent = cat.parentId ? "  └─ " : "";
    console.log(
      `${indent}${cat.name} (id: ${cat.id}, parentId: ${cat.parentId})`,
    );
  });

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
