import { prisma } from "@/lib/prisma";

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
  product_stock_management?: number;
  product_arch?: number;
};

type HiboutikProductImage = {
  url?: string;
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
  for (const p of toCreate) {
    const details = await getHiboutikProductDetails(p.product_id);
    const source = details ?? p;
    const sku = hiboutikSku(p);
    const name = p.product_model!.trim();
    const raw = source as unknown as NamedRow;
    const desc =
      typeof source.product_desc === "string" ? source.product_desc.trim() : "";
    const images = (details?.images ?? [])
      .map((img) => img?.url?.trim())
      .filter((url): url is string => Boolean(url));
    const brandId = await ensureBrand(
      brandNames.get(Number(raw.product_brand)) ?? "Les P'tits Bonheurs",
    );
    const categoryId = await ensureCategory(
      categoryNames.get(Number(raw.product_category)) ?? "À classer",
    );
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
          images,
          stock: Math.max(0, stockById.get(p.product_id) ?? 0),
          status: "DRAFT",
          isNew: true,
          brandId,
          categoryId,
          tags: ["hiboutik"],
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

/**
 * Hiboutik → site : crée les nouveaux produits puis recopie le stock
 * (tous entrepôts cumulés) sur les produits existants.
 */
export async function syncStockFromHiboutik(): Promise<HiboutikSyncReport> {
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
    if (hp.product_stock_management === 0) continue;
    const stock = Math.max(0, stockById.get(hp.product_id) ?? 0);
    if (stock !== sp.stock) {
      await prisma.product.update({ where: { id: sp.id }, data: { stock } });
      updated++;
    }
  }

  return {
    hiboutikProducts: products.length,
    created,
    matched,
    updated,
    unmatchedSiteSkus,
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
