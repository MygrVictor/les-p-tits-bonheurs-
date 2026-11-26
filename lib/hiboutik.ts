import { prisma } from "@/lib/prisma";
import { getCloudinaryClient } from "@/lib/cloudinary";

/**
 * Intégration caisse Hiboutik.
 *
 * Principe : Hiboutik est la SOURCE DE VÉRITÉ du stock (boutique + site).
 * - Hiboutik → site : `syncStockFromHiboutik()` recopie le stock disponible
 *   sur les produits du site (appelé par le webhook de vente et par le bouton admin).
 * - Site → Hiboutik : `pushOrderToHiboutik()` crée une vente clôturée dans
 *   Hiboutik pour chaque commande web payée, ce qui décrémente le stock caisse.
 *
 * Correspondance produit : Product.sku (site) = code-barres Hiboutik,
 * ou à défaut la référence fournisseur Hiboutik.
 *
 * Variables d'env : HIBOUTIK_ACCOUNT, HIBOUTIK_USER, HIBOUTIK_API_KEY,
 * HIBOUTIK_WEBHOOK_SECRET, HIBOUTIK_STORE_ID (défaut 1).
 */

type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_barcode?: string;
  product_supplier_reference?: string;
  product_price?: string;
  product_desc?: string;
  product_category?: number;
  product_stock_management?: number;
  product_arch?: number;
};

type HiboutikProductImage = {
  url?: string;
  image_name?: string;
};

type HiboutikProductDetails = HiboutikProduct & {
  images?: HiboutikProductImage[];
};

type HiboutikStockRow = {
  product_id: number;
  product_size?: number;
  stock_available: number | string;
  warehouse_id?: number;
};

export function isHiboutikConfigured(): boolean {
  return Boolean(
    process.env.HIBOUTIK_ACCOUNT &&
    process.env.HIBOUTIK_USER &&
    process.env.HIBOUTIK_API_KEY,
  );
}

function storeId(): number {
  return Number(process.env.HIBOUTIK_STORE_ID ?? "1") || 1;
}

async function hiboutik<T>(
  path: string,
  init: { method?: string; body?: Record<string, unknown> } = {},
): Promise<T> {
  if (!isHiboutikConfigured()) throw new Error("Hiboutik non configuré.");
  const base = `https://${process.env.HIBOUTIK_ACCOUNT}.hiboutik.com/api`;
  const token = Buffer.from(
    `${process.env.HIBOUTIK_USER}:${process.env.HIBOUTIK_API_KEY}`,
  ).toString("base64");

  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Hiboutik ${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/** Tous les produits Hiboutik (API paginée par 250). */
export async function listHiboutikProducts(): Promise<HiboutikProduct[]> {
  const all: HiboutikProduct[] = [];
  for (let page = 1; page < 200; page++) {
    const batch = await hiboutik<HiboutikProduct[]>(`/products/?p=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 250) break;
  }
  return all;
}

const norm = (v: unknown) =>
  typeof v === "string"
    ? v.trim().toUpperCase()
    : v == null
      ? ""
      : String(v).trim().toUpperCase();

export type HiboutikSyncReport = {
  hiboutikProducts: number;
  created: number;
  matched: number;
  updated: number;
  unmatchedSiteSkus: string[];
  imagesImported: number;
  imagesRemaining: number;
  recategorized: number;
  unmappedCategories: string[];
};

/** Clé de liaison site ↔ caisse : code-barres, sinon réf. fournisseur, sinon id Hiboutik. */
function hiboutikSku(p: HiboutikProduct): string {
  return (
    norm(p.product_barcode) ||
    norm(p.product_supplier_reference) ||
    `HB-${p.product_id}`
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type NamedRow = Record<string, unknown>;

async function getHiboutikProductDetails(
  productId: number,
): Promise<HiboutikProductDetails | null> {
  try {
    const rows = await hiboutik<HiboutikProductDetails[]>(
      `/products/${productId}`,
    );
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows[0] ?? null;
  } catch (error) {
    console.warn(
      `[hiboutik] détail produit indisponible (${productId}):`,
      error,
    );
    return null;
  }
}

/** Table id → nom pour /brands ou /categories (noms de champs défensifs). */
async function loadNames(
  path: string,
  prefix: string,
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const rows = await hiboutik<NamedRow[]>(path);
    for (const r of rows ?? []) {
      const id = Number(r[`${prefix}_id`]);
      const name = String(r[`${prefix}_name`] ?? "").trim();
      if (id && name) map.set(id, name);
    }
  } catch (error) {
    console.warn(`[hiboutik] ${path} indisponible:`, error);
  }
  return map;
}

type HiboutikCategoryNode = { name: string; parent: number };

/** Arbre /categories de Hiboutik : id → { nom, id du parent }. */
async function loadCategoryNodes(): Promise<Map<number, HiboutikCategoryNode>> {
  const nodes = new Map<number, HiboutikCategoryNode>();
  try {
    const rows = await hiboutik<NamedRow[]>("/categories");
    for (const r of rows ?? []) {
      const id = Number(r.category_id);
      if (!id) continue;
      nodes.set(id, {
        name: String(r.category_name ?? "").trim(),
        parent: Number(r.category_id_parent) || 0,
      });
    }
  } catch (error) {
    console.warn("[hiboutik] /categories indisponible:", error);
  }
  return nodes;
}

/**
 * id → [nom, nom du parent, … racine]. Hiboutik a jusqu'à 4 niveaux
 * (Bijouterie > acier inoxydable > doré > bracelets).
 */
function buildCategoryChains(
  nodes: Map<number, HiboutikCategoryNode>,
): Map<number, string[]> {
  const chains = new Map<number, string[]>();
  for (const [id, node] of nodes) {
    const chain: string[] = [];
    let current: HiboutikCategoryNode | undefined = node;
    for (let i = 0; current && i < 8; i++) {
      if (current.name) chain.push(current.name);
      current = current.parent ? nodes.get(current.parent) : undefined;
    }
    if (chain.length > 0) chains.set(id, chain);
  }
  return chains;
}

/** Slugs du site différents de celui qu'on déduit du nom Hiboutik. */
const SITE_SLUG_ALIASES: Record<string, string> = {
  "jeux-et-diy": "jeux-diy",
  "jeux-diy-peinture-aux-numero": "jeux-diy-peinture-au-numero",
  "jeux-diy-carnets-a-aquarelle": "jeux-diy-carnets-aquarelle",
};

/** « PERLES » / « bagues » → « Perles » / « Bagues » (les noms mixtes sont gardés). */
function prettyCategoryName(name: string): string {
  const trimmed = name.trim();
  const pretty =
    trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()
      ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      : trimmed;
  return pretty.replace(/\bdiy\b/gi, "DIY");
}

/**
 * Recopie TOUT l'arbre de catégories Hiboutik sur le site (types compris) :
 * chaque catégorie Hiboutik nommée a sa catégorie du site, au même endroit de
 * l'arbre (slug = slug du parent + nom). Les catégories existantes sont
 * réutilisées, jamais renommées ni supprimées ; seules les manquantes sont
 * créées. Renvoie id Hiboutik → id catégorie du site.
 */
export async function ensureSiteCategoryTree(
  nodes: Map<number, HiboutikCategoryNode>,
): Promise<{ map: Map<number, string>; created: string[] }> {
  const existing = await prisma.category.findMany({
    select: { id: true, slug: true, parentId: true },
  });
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const done = new Map<number, { id: string; slug: string } | null>();
  const created: string[] = [];

  async function resolveNode(
    id: number,
    depth = 0,
  ): Promise<{ id: string; slug: string } | null> {
    if (done.has(id)) return done.get(id) ?? null;
    const node = nodes.get(id);
    if (!node || !node.name || depth > 8) {
      done.set(id, null);
      return null;
    }
    // Un parent sans nom (catégorie fantôme) est ignoré : on remonte à la racine.
    const parent = node.parent ? await resolveNode(node.parent, depth + 1) : null;
    const base = slugify(node.name);
    if (!base) {
      done.set(id, null);
      return null;
    }
    const raw = parent ? `${parent.slug}-${base}` : base;
    const slug = SITE_SLUG_ALIASES[raw] ?? raw;

    let row = bySlug.get(slug);
    if (!row) {
      const createdRow = await prisma.category.create({
        data: {
          name: prettyCategoryName(node.name),
          slug,
          parentId: parent?.id ?? null,
        },
        select: { id: true, slug: true, parentId: true },
      });
      bySlug.set(slug, createdRow);
      created.push(slug);
      row = createdRow;
    }
    const result = { id: row.id, slug: row.slug };
    done.set(id, result);
    return result;
  }

  const map = new Map<number, string>();
  for (const id of nodes.keys()) {
    const resolved = await resolveNode(id);
    if (resolved) map.set(id, resolved.id);
  }
  return { map, created };
}

async function ensureBrand(name: string): Promise<string> {
  const slug = slugify(name) || "sans-marque";
  const brand = await prisma.brand.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });
  return brand.id;
}

async function ensureCategory(name: string): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const slug = slugify(name) || "a-classer";
  const category = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });
  return category.id;
}

/**
 * Hiboutik n'a qu'UNE catégorie par produit, sans sous-catégories. Le site a son
 * arbre (Bijouterie > Acier inoxydable / Plaqué Or, Perlerie, Jeux & DIY > Puzzles…).
 *
 * Règle : le NOM de la catégorie Hiboutik doit être celui d'une catégorie du site
 * (n'importe quel niveau, sans tenir compte des accents/majuscules). Les types (bracelet, collier,
 * boucles…) ne sont pas des catégories : le filtre « Type » du site les repère dans le
 * nom du produit.
 */
const LEGACY_FLAT_SLUGS = new Set([
  "boucles-d-oreilles",
  "bracelets",
  "colliers",
  "chevillieres",
  "ear-cuff",
  "perles",
]);

type SiteCategories = {
  byName: Map<string, string>;
  bySlug: Map<string, string>;
};

/** Les anciennes catégories à plat créées automatiquement sont exclues du match par nom. */
async function loadSiteCategories(): Promise<SiteCategories> {
  const rows = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  const byName = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const c of rows) {
    bySlug.set(c.slug, c.id);
    if (!LEGACY_FLAT_SLUGS.has(c.slug)) byName.set(slugify(c.name), c.id);
  }
  return { byName, bySlug };
}

function typeKeywordsFor(segment: string): string[] {
  const s = slugify(segment);
  if (s === "bracelets") return ["bracelet"];
  if (s === "colliers") return ["collier"];
  if (s === "boucles-d-oreilles") return ["boucles", "oreille"];
  if (s === "bagues") return ["bague"];
  if (s === "boites-a-bijoux") return ["boite", "ecrin"];
  if (s === "chevillieres") return ["chevillere"];
  if (s === "ear-cuff") return ["ear cuff", "ear", "cuff"];
  if (s === "perles") return ["perle"];
  return [];
}

function typeTag(label: string | undefined): string[] {
  if (!label) return [];
  return typeKeywordsFor(label);
}

function lastSegment(label: string): string {
  const parts = label
    .split(/[>/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? label.trim();
}

/** Secours pour les anciennes catégories Hiboutik à plat (BRACELETS, COLLIERS…). */
function legacySlugFor(
  hiboutikCategory: string,
  productName: string,
): string | null {
  const cat = slugify(hiboutikCategory);
  if (cat === "perles") return "perlerie";
  if (
    [
      "boucles-d-oreilles",
      "bracelets",
      "colliers",
      "chevillieres",
      "ear-cuff",
    ].includes(cat)
  ) {
    const name = slugify(productName);
    if (name.includes("plaque")) return "bijouterie-plaque-or";
    if (name.includes("acier")) return "bijouterie-acier-inoxydable";
    return "bijouterie";
  }
  return null;
}

/**
 * `direct` = la catégorie Hiboutik (ou l'un de ses parents) porte le nom d'une
 * catégorie du site. `chain` = [catégorie du produit, parent, grand-parent…] :
 * on prend le niveau le plus profond qui existe sur le site.
 */
function resolveSiteCategory(
  chain: string[],
  productName: string,
  site: SiteCategories,
): { id: string | null; direct: boolean } {
  for (const label of chain) {
    const direct =
      site.byName.get(slugify(label)) ??
      site.byName.get(slugify(lastSegment(label)));
    if (direct) return { id: direct, direct: true };
  }
  const slug = legacySlugFor(chain[0] ?? "", productName);
  return { id: slug ? (site.bySlug.get(slug) ?? null) : null, direct: false };
}

/**
 * Hiboutik = source de vérité de la catégorie : si son nom correspond à une catégorie
 * du site, le produit y est déplacé. Pour les anciennes catégories à plat, la règle de
 * secours ne s'applique qu'aux produits encore dans ces catégories (un rangement
 * manuel fait ensuite sur le site n'est pas écrasé).
 * Renvoie aussi les noms de catégories Hiboutik sans équivalent sur le site.
 */
async function reclassifyProducts(
  byKey: Map<string, HiboutikProduct>,
): Promise<{ moved: number; unmapped: string[] }> {
  const [siteProducts, categoryNodes, site] = await Promise.all([
    prisma.product.findMany({
      where: { sku: { not: null } },
      select: {
        id: true,
        sku: true,
        name: true,
        categoryId: true,
        tags: true,
        category: { select: { slug: true } },
      },
    }),
    loadCategoryNodes(),
    loadSiteCategories(),
  ]);
  const chains = buildCategoryChains(categoryNodes);
  const { map: siteCategoryByHiboutikId } =
    await ensureSiteCategoryTree(categoryNodes);

  let moved = 0;
  const unmapped = new Set<string>();

  for (const sp of siteProducts) {
    const hp = byKey.get(norm(sp.sku));
    if (!hp) continue;
    const hiboutikId = Number(hp.product_category);
    const chain = chains.get(hiboutikId);
    const hiboutikCategory = chain?.[0];
    if (!chain || !hiboutikCategory) continue;

    // Catégorie du site recopiée de Hiboutik ; sinon ancienne règle (par nom).
    const mirrored = siteCategoryByHiboutikId.get(hiboutikId);
    const { id, direct } = mirrored
      ? { id: mirrored, direct: true }
      : resolveSiteCategory(chain, sp.name, site);
    if (!id) {
      unmapped.add(hiboutikCategory);
      continue;
    }
    const allowed = direct || LEGACY_FLAT_SLUGS.has(sp.category.slug);
    const currentTags = Array.isArray(sp.tags) ? (sp.tags as string[]) : [];
    const wanted = typeTag(hiboutikCategory).filter(
      (t) => !currentTags.includes(t),
    );
    if (allowed && (id !== sp.categoryId || wanted.length > 0)) {
      await prisma.product.update({
        where: { id: sp.id },
        data: {
          categoryId: id,
          ...(wanted.length ? { tags: [...currentTags, ...wanted] } : {}),
        },
      });
      if (id !== sp.categoryId) moved++;
    }
  }
  return { moved, unmapped: [...unmapped].sort() };
}

/**
 * Crée sur le site les produits saisis dans Hiboutik qui n'y existent pas encore.
 * Créés en BROUILLON (DRAFT) : la cliente vérifie puis publie.
 * Marque / catégorie reprises de Hiboutik (créées si besoin), sinon « À classer ».
 */
async function createMissingProducts(
  products: HiboutikProduct[],
  stockById: Map<number, number>,
): Promise<number> {
  const existing = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { not: null } },
        select: { sku: true },
      })
    ).map((p) => norm(p.sku)),
  );

  const toCreate = products.filter(
    (p) =>
      p.product_arch !== 1 &&
      (p.product_model ?? "").trim() &&
      !existing.has(hiboutikSku(p)),
  );
  if (toCreate.length === 0) return 0;

  const [brandNames, categoryNodes] = await Promise.all([
    loadNames("/brands", "brand"),
    loadCategoryNodes(),
  ]);
  const categoryNames = buildCategoryChains(categoryNodes);
  const { map: siteCategoryByHiboutikId } =
    await ensureSiteCategoryTree(categoryNodes);

  let created = 0;
  const siteCategories = await loadSiteCategories();
  for (const p of toCreate) {
    const details = await getHiboutikProductDetails(p.product_id);
    const source = details ?? p;
    const sku = hiboutikSku(p);
    const name = p.product_model!.trim();
    const raw = source as unknown as NamedRow;
    const desc =
      typeof source.product_desc === "string" ? source.product_desc.trim() : "";
    const brandId = await ensureBrand(
      brandNames.get(Number(raw.product_brand)) ?? "Les P'tits Bonheurs",
    );
    const chain = categoryNames.get(Number(raw.product_category));
    const hiboutikCategory = chain?.[0];
    const categoryId =
      (siteCategoryByHiboutikId.get(Number(raw.product_category)) ??
        (chain
          ? resolveSiteCategory(chain, name, siteCategories).id
          : null)) ??
      (await ensureCategory(hiboutikCategory ?? "À classer"));
    const price = Math.round((Number(p.product_price) || 0) * 100);
    const discount = Math.round(
      (Number(raw.product_discount_price) || 0) * 100,
    );

    try {
      await prisma.product.create({
        data: {
          name,
          slug: `${slugify(name) || "produit"}-${slugify(sku)}`,
          sku,
          description: desc,
          price,
          salePrice: discount > 0 && discount < price ? discount : null,
          images: [],
          stock: Math.max(0, stockById.get(p.product_id) ?? 0),
          status: "DRAFT",
          isNew: true,
          brandId,
          categoryId,
          tags: ["hiboutik", ...typeTag(hiboutikCategory)],
        },
      });
      existing.add(sku);
      created++;
    } catch (error) {
      console.warn(`[hiboutik] création impossible pour ${sku}:`, error);
    }
  }
  return created;
}

const MAX_IMPORTED_IMAGES = 6;
// Nombre max de produits dont on importe les photos par synchronisation
// (limite le temps d'exécution serverless ; relancer la synchro pour la suite).
const IMAGE_PRODUCTS_PER_RUN = 12;
const IMAGE_CONCURRENCY = 4;

/** Les URLs d'images Hiboutik exigent l'authentification : on télécharge avec les identifiants. */
async function downloadHiboutikImage(url: string): Promise<Buffer | null> {
  try {
    const token = Buffer.from(
      `${process.env.HIBOUTIK_USER}:${process.env.HIBOUTIK_API_KEY}`,
    ).toString("base64");
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (error) {
    console.warn(`[hiboutik] téléchargement image impossible (${url}):`, error);
    return null;
  }
}

async function uploadToCloudinary(buffer: Buffer): Promise<string | null> {
  try {
    const cloudinary = getCloudinaryClient();
    const uploaded = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "les-ptits-bonheurs/products", resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Upload failed"));
              return;
            }
            resolve({ secure_url: result.secure_url });
          },
        );
        stream.end(buffer);
      },
    );
    return uploaded.secure_url;
  } catch (error) {
    console.warn("[hiboutik] upload Cloudinary impossible:", error);
    return null;
  }
}

/** Récupère les grandes photos (big_*) d'un produit Hiboutik et les copie sur Cloudinary. */
async function importProductImages(hiboutikId: number): Promise<string[]> {
  const details = await getHiboutikProductDetails(hiboutikId);
  const all = (details?.images ?? []).filter((img) => Boolean(img?.url));
  const big = all.filter((img) => !(img.image_name ?? "").startsWith("mini_"));
  const chosen = (big.length > 0 ? big : all).slice(0, MAX_IMPORTED_IMAGES);

  const urls: string[] = [];
  for (const img of chosen) {
    const buffer = await downloadHiboutikImage(img.url!);
    if (!buffer) continue;
    const uploaded = await uploadToCloudinary(buffer);
    if (uploaded) urls.push(uploaded);
  }
  return urls;
}

/** Importe les photos des produits Hiboutik du site qui n'en ont pas encore. */
async function backfillImages(
  byKey: Map<string, HiboutikProduct>,
): Promise<{ imported: number; remaining: number }> {
  const candidates = (
    await prisma.product.findMany({
      where: { sku: { not: null } },
      select: { id: true, sku: true, images: true },
    })
  ).filter((p) => Array.isArray(p.images) && p.images.length === 0);

  const batch = candidates.slice(0, IMAGE_PRODUCTS_PER_RUN);
  let imported = 0;

  for (let i = 0; i < batch.length; i += IMAGE_CONCURRENCY) {
    const chunk = batch.slice(i, i + IMAGE_CONCURRENCY);
    await Promise.all(
      chunk.map(async (sp) => {
        const hp = byKey.get(norm(sp.sku));
        if (!hp) return;
        const urls = await importProductImages(hp.product_id);
        if (urls.length === 0) return;
        await prisma.product.update({
          where: { id: sp.id },
          data: { images: urls },
        });
        imported++;
      }),
    );
  }

  return { imported, remaining: Math.max(0, candidates.length - batch.length) };
}

const STOCK_UPDATE_BATCH = 50;

/** Applique les nouveaux stocks par lots transactionnels (au lieu d'un UPDATE par await). */
async function applyStockUpdates(
  updates: { id: string; stock: number }[],
): Promise<number> {
  for (let i = 0; i < updates.length; i += STOCK_UPDATE_BATCH) {
    const chunk = updates.slice(i, i + STOCK_UPDATE_BATCH);
    await prisma.$transaction(
      chunk.map((u) =>
        prisma.product.update({
          where: { id: u.id },
          data: { stock: u.stock },
        }),
      ),
    );
  }
  return updates.length;
}

/** Clés possibles d'un produit caisse côté site (même règle que l'index de syncStockFromHiboutik). */
function hiboutikKeys(p: HiboutikProduct): string[] {
  return [
    norm(p.product_barcode),
    norm(p.product_supplier_reference),
    `HB-${p.product_id}`,
  ].filter(Boolean);
}

/**
 * Lit les produits d'une vente caisse. Hiboutik renvoie la vente sous forme
 * de tableau (une ligne) ou d'objet selon les versions : lecture défensive.
 */
export async function getHiboutikSaleProductIds(
  saleId: number,
): Promise<number[]> {
  const raw = await hiboutik<unknown>(`/sales/${saleId}`);
  const sale = (Array.isArray(raw) ? raw[0] : raw) as
    | { line_items?: { product_id?: number | string }[] }
    | undefined;
  const ids = (sale?.line_items ?? [])
    .map((line) => Number(line.product_id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
}

/**
 * Hiboutik → site, version ciblée : ne recopie le stock QUE des produits
 * caisse donnés (ceux d'une vente). Quelques appels API au lieu de relire
 * tout le catalogue à chaque passage en caisse.
 */
export async function syncStockForHiboutikProducts(
  productIds: number[],
): Promise<{ updated: number }> {
  const updates: { id: string; stock: number }[] = [];

  for (const productId of productIds) {
    const [product, stockRows] = await Promise.all([
      getHiboutikProductDetails(productId),
      hiboutik<HiboutikStockRow[]>(`/stock_available/product_id/${productId}`),
    ]);
    if (!product || product.product_stock_management === 0) continue;
    if (!Array.isArray(stockRows) || stockRows.length === 0) continue;

    const stock = Math.max(
      0,
      stockRows.reduce((sum, row) => sum + (Number(row.stock_available) || 0), 0),
    );
    const siteProducts = await prisma.product.findMany({
      where: {
        OR: hiboutikKeys(product).map((key) => ({
          sku: { equals: key, mode: "insensitive" as const },
        })),
      },
      select: { id: true, stock: true },
    });
    for (const sp of siteProducts) {
      if (sp.stock !== stock) updates.push({ id: sp.id, stock });
    }
  }

  return { updated: await applyStockUpdates(updates) };
}

/**
 * Hiboutik → site : crée les nouveaux produits, recopie le stock
 * (tous entrepôts cumulés) et, si demandé, importe les photos.
 * `withImages` reste désactivé pour le webhook (réponse rapide).
 */
export async function syncStockFromHiboutik(
  options: { withImages?: boolean } = {},
): Promise<HiboutikSyncReport> {
  const [products, stockRows] = await Promise.all([
    listHiboutikProducts(),
    hiboutik<HiboutikStockRow[]>("/stock_available/all_wh"),
  ]);

  const stockById = new Map<number, number>();
  for (const row of stockRows ?? []) {
    const qty = Number(row.stock_available) || 0;
    stockById.set(row.product_id, (stockById.get(row.product_id) ?? 0) + qty);
  }

  // Index Hiboutik : code-barres puis référence fournisseur.
  const byKey = new Map<string, HiboutikProduct>();
  for (const p of products) {
    if (p.product_arch === 1) continue;
    const ref = norm(p.product_supplier_reference);
    const bar = norm(p.product_barcode);
    if (ref && !byKey.has(ref)) byKey.set(ref, p);
    if (bar) byKey.set(bar, p);
    byKey.set(`HB-${p.product_id}`, p);
  }

  const created = await createMissingProducts(products, stockById);
  const { moved: recategorized, unmapped: unmappedCategories } =
    await reclassifyProducts(byKey);

  // Hiboutik ne renvoie pas de niveaux de stock pour ce compte/warehouse =>
  // on ne doit pas écraser les stocks du site à 0 en l'absence de donnée.
  const hasStockData = Array.isArray(stockRows) && stockRows.length > 0;

  const siteProducts = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { id: true, sku: true, stock: true },
  });

  let matched = 0;
  const unmatchedSiteSkus: string[] = [];
  const stockUpdates: { id: string; stock: number }[] = [];

  for (const sp of siteProducts) {
    const hp = byKey.get(norm(sp.sku));
    if (!hp) {
      unmatchedSiteSkus.push(sp.sku!);
      continue;
    }
    matched++;
    // Produit sans gestion de stock côté caisse : on ne touche pas au site.
    if (!hasStockData || hp.product_stock_management === 0) continue;
    const stock = Math.max(0, stockById.get(hp.product_id) ?? 0);
    if (stock !== sp.stock) stockUpdates.push({ id: sp.id, stock });
  }

  const updated = await applyStockUpdates(stockUpdates);

  const images = options.withImages
    ? await backfillImages(byKey)
    : { imported: 0, remaining: 0 };

  return {
    hiboutikProducts: products.length,
    created,
    matched,
    updated,
    unmatchedSiteSkus,
    imagesImported: images.imported,
    imagesRemaining: images.remaining,
    recategorized,
    unmappedCategories,
  };
}

/** SKU de secours attribué aux produits caisse sans code-barres ni réf. fournisseur. */
const FALLBACK_SKU = /^HB-(\d+)$/i;

export async function findHiboutikProductId(
  sku: string,
): Promise<number | null> {
  // `HB-<id>` n'est ni un code-barres ni une réf. fournisseur : c'est
  // directement l'identifiant Hiboutik (voir hiboutikSku). Sans ce cas, les
  // ventes web de ces produits ne décrémentaient jamais le stock caisse.
  const fallback = FALLBACK_SKU.exec(sku.trim());
  if (fallback) return Number(fallback[1]);

  for (const path of [
    `/products/search/barcode/${encodeURIComponent(sku)}/`,
    `/products/search/supplier_reference/${encodeURIComponent(sku)}/`,
  ]) {
    try {
      const res = await hiboutik<HiboutikProduct[]>(path);
      if (Array.isArray(res) && res[0]?.product_id) return res[0].product_id;
    } catch {
      // 404 = pas trouvé, on tente la clé suivante
    }
  }
  return null;
}

/**
 * Enregistre une commande web comme vente clôturée dans Hiboutik
 * (décrémente le stock caisse). Best effort : ne lève jamais.
 */
export async function pushOrderToHiboutik(order: {
  id: string;
  items: { sku: string | null; quantity: number; price: number }[];
}): Promise<void> {
  if (!isHiboutikConfigured()) return;
  try {
    const lines = [];
    for (const item of order.items) {
      if (!item.sku) continue;
      const productId = await findHiboutikProductId(item.sku);
      if (productId) lines.push({ productId, ...item });
      else
        console.warn(`[hiboutik] SKU introuvable dans la caisse: ${item.sku}`);
    }
    if (lines.length === 0) return;

    const sale = await hiboutik<{ sale_id: number }>("/sales/", {
      method: "POST",
      body: { store_id: storeId(), currency_code: "EUR" },
    });

    for (const line of lines) {
      await hiboutik("/sales/add_product/", {
        method: "POST",
        body: {
          sale_id: sale.sale_id,
          product_id: line.productId,
          quantity: line.quantity,
          product_price: (line.price / 100).toFixed(2),
          stock_withdrawal: "1",
        },
      });
    }

    await hiboutik("/sales/comments/", {
      method: "POST",
      body: {
        sale_id: sale.sale_id,
        comments: `Commande site web ${order.id}`,
      },
    }).catch(() => undefined);

    await hiboutik("/sales/close/", {
      method: "POST",
      body: { sale_id: sale.sale_id },
    });
  } catch (error) {
    console.error("[hiboutik] pushOrderToHiboutik failed:", error);
  }
}
