/**
 * Rate limiting.
 *
 * - `checkRateLimit()` (utilisé par le middleware) : compteur PARTAGÉ dans
 *   Upstash Redis si UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN sont
 *   définis — indispensable sur Vercel, où chaque instance serverless a sa
 *   propre mémoire. Appel REST direct (pas de dépendance npm). Si Upstash
 *   n'est pas configuré ou ne répond pas, repli sur le compteur mémoire.
 * - `rateLimit()` : compteur en mémoire (fenêtre fixe), suffisant pour un
 *   déploiement mono-instance (VPS, Railway, Render…).
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

const UPSTASH_TIMEOUT_MS = 800;

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `rl:${key}`;
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // Fenêtre fixe : la clé est créée avec son expiration au 1er hit.
    body: JSON.stringify([
      ["SET", redisKey, "0", "PX", String(windowMs), "NX"],
      ["INCR", redisKey],
      ["PTTL", redisKey],
    ]),
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

  const [, incr, pttl] = (await res.json()) as { result?: unknown }[];
  const count = Number(incr?.result);
  if (!Number.isFinite(count)) throw new Error("Upstash: réponse inattendue");
  const ttl = Math.max(0, Number(pttl?.result) || windowMs);

  return count > limit
    ? { ok: false, retryAfterMs: ttl }
    : { ok: true, remaining: limit - count };
}

/** Rate limit partagé (Upstash) avec repli automatique sur la mémoire. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  try {
    const shared = await upstashRateLimit(key, limit, windowMs);
    if (shared) return shared;
  } catch (error) {
    console.warn("[rate-limit] Upstash indisponible, repli mémoire:", error);
  }
  return rateLimit(key, limit, windowMs);
}
