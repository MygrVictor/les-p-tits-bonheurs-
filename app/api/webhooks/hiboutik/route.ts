import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidateCatalog } from "@/lib/catalog-cache";
import {
  getHiboutikSaleProductIds,
  syncStockForHiboutikProducts,
  syncStockFromHiboutik,
} from "@/lib/hiboutik";

export const dynamic = "force-dynamic";

/**
 * Webhook Hiboutik (action "sale" = vente clôturée, ou "product").
 * URL à déclarer dans Hiboutik :
 *   https://<domaine>/api/webhooks/hiboutik?token=<HIBOUTIK_WEBHOOK_SECRET>
 *
 * Vente : on ne resynchronise que les produits de la vente (rapide).
 * Autre événement, ou vente illisible : synchro complète (comme avant).
 */
function validToken(token: string | null): boolean {
  const secret = process.env.HIBOUTIK_WEBHOOK_SECRET;
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Hiboutik poste en x-www-form-urlencoded ; on accepte aussi le JSON. */
async function readSaleId(request: Request): Promise<number | null> {
  try {
    const text = await request.text();
    if (!text) return null;
    let value: unknown;
    if (text.trim().startsWith("{")) {
      value = (JSON.parse(text) as { sale_id?: unknown }).sale_id;
    } else {
      value = new URLSearchParams(text).get("sale_id");
    }
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!validToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const saleId = await readSaleId(request);

  if (saleId) {
    try {
      const productIds = await getHiboutikSaleProductIds(saleId);
      if (productIds.length > 0) {
        const { updated } = await syncStockForHiboutikProducts(productIds);
        revalidateCatalog();
        return NextResponse.json({ ok: true, mode: "sale", updated });
      }
    } catch (error) {
      console.warn(
        "[hiboutik webhook] synchro ciblée impossible, synchro complète:",
        error,
      );
    }
  }

  try {
    const report = await syncStockFromHiboutik();
    revalidateCatalog();
    return NextResponse.json({
      ok: true,
      mode: "full",
      ...report,
      unmatchedSiteSkus: report.unmatchedSiteSkus.length,
    });
  } catch (error) {
    console.error("[hiboutik webhook] sync failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
