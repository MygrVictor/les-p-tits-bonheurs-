// Recopie l'arbre de catégories Hiboutik sur le site (types compris).
//
// Même règle que ensureSiteCategoryTree() dans lib/hiboutik.ts : slug du site =
// slug du parent + nom Hiboutik. Les catégories existantes sont réutilisées,
// jamais renommées ni supprimées ; seules les manquantes sont créées.
//
// Usage :
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs          (simulation)
//   node --env-file=.env scripts/sync-hiboutik-categories.mjs --apply  (crée)
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
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

console.log(apply ? "MODE APPLY" : "SIMULATION (rien n'est écrit)");
console.log(`Déjà présentes : ${reused}`);
console.log(`À créer / créées : ${toCreate.length}`);
for (const c of toCreate) {
  console.log(`  + ${c.slug.padEnd(52)} "${c.name}"  (parent: ${c.parentSlug ?? "racine"})`);
}
await prisma.$disconnect();
