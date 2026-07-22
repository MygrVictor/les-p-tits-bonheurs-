import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({ rateLimit: rateLimitMock }));
vi.mock("@/lib/auth.config", () => ({ authConfig: {} }));
vi.mock("next-auth", () => ({
  default: () => ({
    auth: (cb: any) => (request: any) => cb(request),
  }),
}));

function req(
  pathname: string,
  authUser: any = null,
  headers: HeadersInit = {},
) {
  const url = `https://example.com${pathname}`;
  return {
    url,
    nextUrl: { pathname },
    headers: new Headers(headers),
    auth: authUser ? { user: authUser } : null,
  } as any;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.resetModules();
    rateLimitMock.mockReset();
    rateLimitMock.mockReturnValue({ ok: true, remaining: 10 });
  });

  it("redirects /login to /compte", async () => {
    const middleware = (await import("./middleware")).default;
    const res = await middleware(req("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/compte");
  });

  it("redirects non-admin access to /admin", async () => {
    const middleware = (await import("./middleware")).default;
    const res = await middleware(req("/admin", { role: "CLIENT" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/compte");
  });

  it("allows admin and sets security headers", async () => {
    const middleware = (await import("./middleware")).default;
    const res = await middleware(
      req("/admin", { role: "ADMIN" }, { "x-forwarded-for": "1.2.3.4" }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
  });

  it("returns 429 when rate limit is exceeded", async () => {
    rateLimitMock.mockReturnValue({ ok: false, retryAfterMs: 1500 });
    const middleware = (await import("./middleware")).default;
    const res = await middleware(
      req("/api/contact", null, { "x-forwarded-for": "1.2.3.4" }),
    );

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("2");
  });
});
