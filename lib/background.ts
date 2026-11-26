/**
 * Lance une tâche "après la réponse" (email, synchro caisse…) sans faire
 * attendre le client, et sans qu'un échec puisse remonter jusqu'à lui.
 *
 * Sur Vercel, la fonction serverless est gelée dès la réponse envoyée : on
 * lui signale via `waitUntil` qu'il reste du travail. On lit directement le
 * contexte de requête Vercel (exactement ce que fait le paquet
 * @vercel/functions, sans ajouter de dépendance). Hors Vercel (serveur Node
 * classique), le contexte est absent et la promesse continue simplement
 * de tourner en tâche de fond.
 */
type VercelRequestContext = {
  get?: () => { waitUntil?: (promise: Promise<unknown>) => void } | undefined;
};

function vercelWaitUntil(promise: Promise<unknown>): void {
  const context = (globalThis as Record<symbol, unknown>)[
    Symbol.for("@vercel/request-context")
  ] as VercelRequestContext | undefined;
  context?.get?.()?.waitUntil?.(promise);
}

export function runInBackground(
  label: string,
  task: Promise<unknown> | unknown,
): void {
  const safe = Promise.resolve(task).catch((error) => {
    console.error(`[background] ${label} a échoué:`, error);
  });
  vercelWaitUntil(safe);
}
