import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeCtor = vi.fn();
const getEnvMock = vi.fn(() => ({ STRIPE_SECRET_KEY: "sk_test_abc" }));

class StripeMock {
  key: string;
  options: unknown;

  constructor(key: string, options: unknown) {
    this.key = key;
    this.options = options;
    stripeCtor(key, options);
  }
}

vi.mock("stripe", () => ({ default: StripeMock }));
vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));

describe("getStripeClient", () => {
  beforeEach(() => {
    vi.resetModules();
    stripeCtor.mockClear();
    getEnvMock.mockClear();
  });

  it("creates stripe client once and reuses it", async () => {
    const { getStripeClient } = await import("../stripe");
    const a = getStripeClient();
    const b = getStripeClient();

    expect(a).toBe(b);
    expect(getEnvMock).toHaveBeenCalledTimes(1);
    expect(stripeCtor).toHaveBeenCalledTimes(1);
    expect(stripeCtor).toHaveBeenCalledWith("sk_test_abc", {
      apiVersion: "2024-04-10",
      typescript: true,
    });
  });
});
