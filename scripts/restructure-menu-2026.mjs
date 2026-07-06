// Script one-off : restructure l'arborescence des catégories pour refléter
// le nouveau menu principal (juillet 2026) fourni par la cliente.
//
// Renomme les catégories racines existantes, crée les sous-catégories
// (2e niveau, géré par l'admin actuel), et re-parente "Sac et petite
// maroquinerie" sous Lifestyle > Maroquinerie pour préserver le produit
// déjà lié plutôt que de perdre cette association.
//
// Idempotent : peut être relancé sans risque (upsert par slug).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertRoot(name, slug) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId: null },
    create: { name, slug },
  });
}

async function upsertChild(name, slug, parentId) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId },
    create: { name, slug, parentId },
  });
}

/**
 * Renomme une catégorie existante en changeant son slug (ex : ancien slug
 * "bijoux" → nouveau slug "bijouterie"). Si l'ancien slug n'existe pas mais
 * que le nouveau existe déjà (script relancé), ne fait rien de plus que
 * mettre à jour le nom.
 */
async function renameRoot(oldSlug, newName, newSlug) {
  const existing = await prisma.category.findUnique({
    where: { slug: oldSlug },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { name: newName, slug: newSlug },
    });
  }

  return upsertRoot(newName, newSlug);
}

(async () => {
  // ── 1. Bijouterie (ex-Bijoux) + 2 univers ──────────────────────────────
  const bijouterie = await renameRoot("bijoux", "Bijouterie", "bijouterie");
  await upsertChild(
    "Acier inoxydable",
    "bijouterie-acier-inoxydable",
    bijouterie.id,
  );
  await upsertChild("Plaqué Or", "bijouterie-plaque-or", bijouterie.id);

  // ── 2. Perlerie (inchangée) ─────────────────────────────────────────────
  await upsertRoot("Perlerie", "perlerie");

  // ── 3. Jeux & DIY (ex-DIY & Loisirs créatifs) + 8 familles ─────────────
  const jeuxDiy = await renameRoot(
    "diy-loisirs-creatifs",
    "Jeux & DIY",
    "jeux-diy",
  );
  await upsertChild("Puzzles", "jeux-diy-puzzles", jeuxDiy.id);
  await upsertChild("Jeux", "jeux-diy-jeux", jeuxDiy.id);
  await upsertChild(
    "Peinture au numéro",
    "jeux-diy-peinture-au-numero",
    jeuxDiy.id,
  );
  await upsertChild(
    "Diamond Painting",
    "jeux-diy-diamond-painting",
    jeuxDiy.id,
  );
  await upsertChild(
    "Carnets à aquarelle",
    "jeux-diy-carnets-aquarelle",
    jeuxDiy.id,
  );
  await upsertChild("Pastels", "jeux-diy-pastels", jeuxDiy.id);
  await upsertChild("Kits DIY", "jeux-diy-kits-diy", jeuxDiy.id);
  await upsertChild("Kits bijoux", "jeux-diy-kits-bijoux", jeuxDiy.id);

  // ── 4. Lifestyle + 6 familles ───────────────────────────────────────────
  const lifestyle = await upsertRoot("Lifestyle", "lifestyle");

  // Re-parente l'ancienne catégorie "Sac et petite maroquinerie" (qui a déjà
  // un produit lié) plutôt que d'en créer une nouvelle vide.
  const ancienSac = await prisma.category.findUnique({
    where: { slug: "sac-et-petite-maroquinerie" },
  });
  if (ancienSac) {
    await prisma.category.update({
      where: { id: ancienSac.id },
      data: {
        name: "Maroquinerie",
        slug: "lifestyle-maroquinerie",
        parentId: lifestyle.id,
      },
    });
  } else {
    await upsertChild("Maroquinerie", "lifestyle-maroquinerie", lifestyle.id);
  }

  await upsertChild(
    "Accessoires cheveux",
    "lifestyle-accessoires-cheveux",
    lifestyle.id,
  );
  await upsertChild(
    "Foulards & Bandeaux",
    "lifestyle-foulards-bandeaux",
    lifestyle.id,
  );
  await upsertChild("Chaussettes", "lifestyle-chaussettes", lifestyle.id);
  await upsertChild("Pin's", "lifestyle-pins", lifestyle.id);
  await upsertChild(
    "Trousses de toilette",
    "lifestyle-trousses-toilette",
    lifestyle.id,
  );

  // ── 5. Décoration & Maison (ex-Décoration et maison) + 3 familles ──────
  const decoration = await renameRoot(
    "decoration-et-maison",
    "Décoration & Maison",
    "decoration-maison",
  );
  await upsertChild(
    "Arts de la table",
    "decoration-maison-arts-table",
    decoration.id,
  );
  await upsertChild("Bougies", "decoration-maison-bougies", decoration.id);
  await upsertChild(
    "Décoration murale",
    "decoration-maison-murale",
    decoration.id,
  );

  // ── 6. Papeterie (inchangée) ────────────────────────────────────────────
  await upsertRoot("Papeterie", "papeterie");

  // ── 7. Collections transverses (pas de sous-catégories) ────────────────
  await upsertRoot("Acheter par couleur", "couleurs");
  await upsertRoot("Coups de cœur Pauline", "coups-de-coeur");

  const all = await prisma.category.findMany({
    select: { name: true, slug: true, parentId: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  console.log("✓ Arborescence des catégories mise à jour :\n");
  for (const cat of all) {
    console.log(`${cat.parentId ? "  └─ " : ""}${cat.name} (${cat.slug})`);
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Erreur :", e);
  await prisma.$disconnect();
  process.exit(1);
});
