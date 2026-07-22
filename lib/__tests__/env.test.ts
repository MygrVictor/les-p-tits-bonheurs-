import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setValidEnv() {
  process.env.DATABASE_URL = "postgres://db";
  process.env.DIRECT_URL = "postgres://direct";
  process.env.NEXTAUTH_URL = "https://example.com";
  process.env.NEXTAUTH_SECRET = "x".repeat(32);
  process.env.AUTH_SECRET = "y".repeat(32);
  process.env.SUPABASE_URL = "https://supabase.example.com";
  process.env.SUPABASE_ANON_KEY = "anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
  process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@example.com";
  process.env.ADMIN_BOOTSTRAP_PASSWORD = "verysecurepass";
  process.env.STRIPE_SECRET_KEY = "sk_test_123";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_123";
  process.env.RESEND_API_KEY = "re_123";
  process.env.RESEND_FROM = "noreply@example.com";
  process.env.CLOUDINARY_CLOUD_NAME = "cloud";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";
  process.env.AUTH_TRUST_HOST = "true";
  process.env.NODE_ENV = "test";
}

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setValidEnv();
  });

  it("parses environment successfully", async () => {
    const { getEnv } = await import("../env");
    const env = getEnv();
    expect(env.NEXTAUTH_URL).toBe("https://example.com");
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_123");
  });

  it("returns cached object on repeated calls", async () => {
    const { getEnv } = await import("../env");
    const a = getEnv();
    process.env.NEXTAUTH_URL = "https://changed.example.com";
    const b = getEnv();
    expect(a).toBe(b);
    expect(b.NEXTAUTH_URL).toBe("https://example.com");
  });

  it("throws when required variables are missing", async () => {
    delete process.env.NEXTAUTH_SECRET;
    const { getEnv } = await import("../env");
    expect(() => getEnv()).toThrow();
  });
});
