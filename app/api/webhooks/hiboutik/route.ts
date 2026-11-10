import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { syncStockFromHiboutik } from "@/lib/hiboutik";

export const dynamic = "force-dynamic";

/**
 * Webhook Hiboutik (action "sale" = vente clôturée, ou "product").
 * URL à déclarer dans Hiboutik :
 *   https://<domaine>/api/webhooks/hiboutik?token=<HIBOUTIK_WEBHOOK_SECRET>
 * À chaque événement, on resynchronise le stock depuis Hiboutik.
 */
function validToken(token: string | null): boolean {
  const secret = process.env.HIBOUTIK_WEBHOOK_SECRET;
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!validToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const report = await syncStockFromHiboutik();
    revalidatePath("/", "layout");
    return NextResponse.json({
      ok: true,
      ...report,
      unmatchedSiteSkus: report.unmatchedSiteSkus.length,
    });
  } catch (error) {
    console.error("[hiboutik webhook] sync failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
