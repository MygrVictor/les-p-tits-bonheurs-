import { describe, it, expect } from "vitest";
import { hashAuthToken } from "../auth-tokens";

describe("hashAuthToken", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashAuthToken("test-token");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same input", () => {
    const hash1 = hashAuthToken("my-secret-token");
    const hash2 = hashAuthToken("my-secret-token");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different tokens", () => {
    const hash1 = hashAuthToken("token-a");
    const hash2 = hashAuthToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string without throwing", () => {
    expect(() => hashAuthToken("")).not.toThrow();
  });
});
