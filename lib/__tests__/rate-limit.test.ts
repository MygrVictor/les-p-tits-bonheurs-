import { describe, it, expect } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, 5, 60_000);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.remaining).toBe(4);
  });

  it("blocks when limit is exceeded", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 60_000);
    }
    const result = rateLimit(key, 3, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window expires", async () => {
    const key = `test-reset-${Date.now()}`;
    rateLimit(key, 1, 50);
    rateLimit(key, 1, 50);
    await new Promise((resolve) => setTimeout(resolve, 60));
    const result = rateLimit(key, 1, 50);
    expect(result.ok).toBe(true);
  });

  it("tracks different keys independently", () => {
    const key1 = `test-k1-${Date.now()}`;
    const key2 = `test-k2-${Date.now()}`;
    rateLimit(key1, 1, 60_000);
    rateLimit(key1, 1, 60_000);
    const r2 = rateLimit(key2, 1, 60_000);
    expect(r2.ok).toBe(true);
  });
});
