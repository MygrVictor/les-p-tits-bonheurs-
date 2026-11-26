import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Cache des lectures catalogue (pages catégorie, nouveautés, fiche produit).
 *
 * Les pages boutique lisent `searchParams` (filtres) : elles restent donc
 * rendues à la demande, mais leurs requêtes Prisma passent par ce cache.
 * Durée de vie courte (5 min) en filet de sécurité ; l'invalidation réelle
 * se fait via `revalidateCatalog()` dès qu'un stock ou un produit change
 * (webhook Hiboutik, synchro admin, édition produit).
 *
 * ⚠ unstable_cache sérialise en JSON : les Date ressortent en chaînes.
 * Les loaders mis en cache doivent donc renvoyer des données déjà
 * "plates" (dates en ISO).
 */
export const CATALOG_TAG = "catalog";
export const CATALOG_REVALIDATE_SECONDS = 300;

export function cachedCatalog<Args extends unknown[], T>(
  name: string,
  loader: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<T> {
  return unstable_cache(loader, [`catalog:${name}`], {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_TAG],
  });
}

/** À appeler après toute modification de produit ou de stock. */
export function revalidateCatalog() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
}
