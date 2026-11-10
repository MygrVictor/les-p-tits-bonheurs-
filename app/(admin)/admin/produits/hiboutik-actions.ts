"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isHiboutikConfigured, syncStockFromHiboutik } from "@/lib/hiboutik";

export type HiboutikSyncState = { message: string; ok: boolean } | null;

export async function syncHiboutikAction(
  _prev: HiboutikSyncState,
): Promise<HiboutikSyncState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, message: "Accès refusé." };
  }
  if (!isHiboutikConfigured()) {
    return { ok: false, message: "Hiboutik n'est pas configuré (.env)." };
  }
  try {
    const r = await syncStockFromHiboutik({ withImages: true });
    revalidatePath("/", "layout");
    const missing = r.unmatchedSiteSkus.length
      ? ` — ${r.unmatchedSiteSkus.length} réf. absentes de la caisse (${r.unmatchedSiteSkus.slice(0, 5).join(", ")}${r.unmatchedSiteSkus.length > 5 ? "…" : ""})`
      : "";
    return {
      ok: true,
      message: `${r.created} nouveaux produits créés (en brouillon), ${r.matched} produits liés, ${r.updated} stocks mis à jour, ${r.imagesImported} produits avec photos importées${r.imagesRemaining > 0 ? ` (${r.imagesRemaining} restants : relance la synchro)` : ""}${missing}.`,
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Échec de la synchronisation Hiboutik." };
  }
}
