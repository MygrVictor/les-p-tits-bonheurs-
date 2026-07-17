/**
 * Rate limiter en mémoire (sliding window) — adapté pour un déploiement
 * mono-instance (VPS, Railway, Render…).
 * ⚠️  Sur Vercel Edge / multi-instance, remplacer par @upstash/ratelimit :
 *   https://upstash.com/docs/ratelimit/sdks/ts/overview
 */

type Window = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Window>();

/** Nettoyage périodique des entrées expirées pour éviter les fuites mémoire. */
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

/**
 * @param key        Identifiant unique (ex. `auth:${ip}`)
 * @param limit      Nombre max de requêtes dans la fenêtre
 * @param windowMs   Durée de la fenêtre en ms (défaut 60 s)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt <= now) {
    win = { count: 1, resetAt: now + windowMs };
    store.set(key, win);
    return { ok: true, remaining: limit - 1 };
  }

  win.count += 1;

  if (win.count > limit) {
    return { ok: false, retryAfterMs: win.resetAt - now };
  }

  return { ok: true, remaining: limit - win.count };
}
