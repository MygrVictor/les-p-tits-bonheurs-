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
    const own = new Map<number, string>();
    const parentOf = new Map<number, number>();
    for (const r of rows ?? []) {
      const id = Number(r[`${prefix}_id`]);
      const name = String(r[`${prefix}_name`] ?? "").trim();
      if (!id || !name) continue;
      own.set(id, name);
      parentOf.set(id, Number(r[`${prefix}_id_parent`]) || 0);
    }
    for (const [id, name] of own) {
      const parts = [name];
      let p = parentOf.get(id) ?? 0;
      for (let i = 0; p && own.has(p) && i < 5; i++) {
        parts.unshift(own.get(p)!);
        p = parentOf.get(p) ?? 0;
      }
      map.set(id, parts.join(" > "));
    }
  } catch (error) {
    console.warn(`[hiboutik] ${path} indisponible:`, error);
  }
  return map;
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
 * (n'importe quel niveau, sans tenir compte des accents/majuscules). On accepte aussi
 * « Parent > Enfant » : seul le dernier élément compte. Les types (bracelet, collier,
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

function typeTag(label: string | undefined): string[] {
  if (!label || !/[>/]/.test(label)) return [];
  return [lastSegment(label)];
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

/** `direct` = la catégorie Hiboutik porte le nom d'une catégorie du site. */
function resolveSiteCategory(
  hiboutikCategory: string,
  productName: string,
  site: SiteCategories,
): { id: string | null; direct: boolean } {
  const parts = hiboutikCategory
    .split(/[>/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const parent = site.byName.get(slugify(parts[parts.length - 2]));
    if (parent) return { id: parent, direct: true };
  }
  const direct = site.byName.get(slugify(lastSegment(hiboutikCategory)));
  if (direct) return { id: direct, direct: true };
  const slug = legacySlugFor(hiboutikCategory, productName);
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
  const [siteProducts, categoryNames, site] = await Promise.all([
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
    loadNames("/categories", "category"),
    loadSiteCategories(),
  ]);

  let moved = 0;
  const unmapped = new Set<string>();

  for (const sp of siteProducts) {
    const hp = byKey.get(norm(sp.sku));
    if (!hp) continue;
    const hiboutikCategory = categoryNames.get(Number(hp.product_category));
    if (!hiboutikCategory) continue;

    const { id, direct } = resolveSiteCategory(hiboutikCategory, sp.name, site);
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

  const [brandNames, categoryNames] = await Promise.all([
    loadNames("/brands", "brand"),
    loadNames("/categories", "category"),
  ]);

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
    const hiboutikCategory = categoryNames.get(Number(raw.product_category));
    const categoryId =
      (hiboutikCategory
        ? resolveSiteCategory(hiboutikCategory, name, siteCategories).id
        : null) ?? (await ensureCategory(hiboutikCategory ?? "À classer"));
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
  let updated = 0;
  const unmatchedSiteSkus: string[] = [];

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
    if (stock !== sp.stock) {
      await prisma.product.update({ where: { id: sp.id }, data: { stock } });
      updated++;
    }
  }

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

async function findHiboutikProductId(sku: string): Promise<number | null> {
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
