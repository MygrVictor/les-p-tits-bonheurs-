// Recopie l'arbre de catégories Hiboutik sur le site (types compris).
//
// Même règle que ensureSiteCategoryTree() dans lib/hiboutik.ts : slug du site =
// slug du parent + nom Hiboutik. Les catégories existantes sont réutilisées,
// jamais renommées ni supprimées ; seules les manquantes sont créées.
//
// Usage :
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs          (simulation)
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs --apply  (crée)
//
// Nettoyage (à part, jamais automatique) : catégories du site absentes de
// Hiboutik, supprimées SEULEMENT si elles n'ont ni produit ni sous-catégorie
// restante. « couleurs » (page spéciale) est toujours conservée.
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs --prune          (simulation)
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs --prune --apply  (supprime)
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const prune = process.argv.includes("--prune");
const PROTECTED_SLUGS = new Set(["couleurs"]);
const prisma = new PrismaClient();

const SLUG_ALIASES = {
  "jeux-et-diy": "jeux-diy",
  "jeux-diy-peinture-aux-numero": "jeux-diy-peinture-au-numero",
  "jeux-diy-carnets-a-aquarelle": "jeux-diy-carnets-aquarelle",
};

const slugify = (input) =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const prettyName = (name) => {
  const t = name.trim();
  const pretty =
    t === t.toUpperCase() || t === t.toLowerCase()
      ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
      : t;
  return pretty.replace(/\bdiy\b/gi, "DIY");
};

const token = Buffer.from(
  `${process.env.HIBOUTIK_USER}:${process.env.HIBOUTIK_API_KEY}`,
).toString("base64");
const res = await fetch(
  `https://${process.env.HIBOUTIK_ACCOUNT}.hiboutik.com/api/categories`,
  { headers: { Authorization: `Basic ${token}`, Accept: "application/json" } },
);
if (!res.ok) throw new Error(`Hiboutik HTTP ${res.status}`);

const nodes = new Map();
for (const r of await res.json()) {
  nodes.set(Number(r.category_id), {
    name: String(r.category_name ?? "").trim(),
    parent: Number(r.category_id_parent) || 0,
  });
}

const existing = await prisma.category.findMany({
  select: { id: true, slug: true, parentId: true },
});
const bySlug = new Map(existing.map((c) => [c.slug, c]));
const done = new Map();
const toCreate = [];
let reused = 0;

async function resolveNode(id, depth = 0) {
  if (done.has(id)) return done.get(id);
  const node = nodes.get(id);
  if (!node || !node.name || depth > 8) return null;
  const parent = node.parent ? await resolveNode(node.parent, depth + 1) : null;
  const base = slugify(node.name);
  if (!base) return null;
  const raw = parent ? `${parent.slug}-${base}` : base;
  const slug = SLUG_ALIASES[raw] ?? raw;

  let row = bySlug.get(slug);
  if (row) {
    reused += 1;
  } else {
    const data = {
      name: prettyName(node.name),
      slug,
      parentId: parent?.id ?? null,
    };
    toCreate.push({ ...data, parentSlug: parent?.slug ?? null });
    row = apply
      ? await prisma.category.create({ data })
      : { id: `(nouvelle:${slug})`, slug, parentId: data.parentId };
    bySlug.set(slug, row);
  }
  const result = { id: row.id, slug: row.slug };
  done.set(id, result);
  return result;
}

for (const id of nodes.keys()) await resolveNode(id);

if (prune) {
  const mirrored = new Set([...done.values()].filter(Boolean).map((c) => c.slug));
  const all = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      parentId: true,
      _count: { select: { products: true } },
    },
  });
  const candidates = all.filter(
    (c) => !mirrored.has(c.slug) && !PROTECTED_SLUGS.has(c.slug),
  );
  // Tant qu'une catégorie a des produits ou un enfant conservé, elle reste.
  const kept = new Set(
    all.filter((c) => !candidates.includes(c)).map((c) => c.id),
  );
  const removable = new Set(candidates.map((c) => c.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of candidates) {
      if (!removable.has(c.id)) continue;
      const hasProducts = c._count.products > 0;
      const hasKeptChild = all.some(
        (x) => x.parentId === c.id && !removable.has(x.id),
      );
      if (hasProducts || hasKeptChild) {
        removable.delete(c.id);
        kept.add(c.id);
        changed = true;
      }
    }
  }
  console.log(apply ? "MODE APPLY (nettoyage)" : "SIMULATION nettoyage (rien n'est supprimé)");
  console.log("Supprimables (vides, absentes de Hiboutik) :");
  for (const c of candidates.filter((x) => removable.has(x.id))) console.log(`  - ${c.slug}  "${c.name}"`);
  console.log("Conservées car elles contiennent des produits :");
  for (const c of candidates.filter((x) => !removable.has(x.id))) console.log(`  = ${c.slug}  "${c.name}"  (${c._count.products} produit(s))`);
  if (apply) {
    await prisma.category.deleteMany({ where: { id: { in: [...removable] } } });
  }
  await prisma.$disconnect();
  process.exit(0);
}

console.log(apply ? "MODE APPLY" : "SIMULATION (rien n'est écrit)");
console.log(`Déjà présentes : ${reused}`);
console.log(`À créer / créées : ${toCreate.length}`);
for (const c of toCreate) {
  console.log(`  + ${c.slug.padEnd(52)} "${c.name}"  (parent: ${c.parentSlug ?? "racine"})`);
}
await prisma.$disconnect();
