import { beforeEach, describe, expect, it, vi } from "vitest";

const resendCtor = vi.fn();
const getEnvMock = vi.fn(() => ({ RESEND_API_KEY: "re_test_123" }));

class ResendMock {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    resendCtor(apiKey);
  }
}

vi.mock("resend", () => ({ Resend: ResendMock }));
vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));

describe("getResendClient", () => {
  beforeEach(() => {
    vi.resetModules();
    resendCtor.mockClear();
    getEnvMock.mockClear();
  });

  it("creates client once and reuses it", async () => {
    const { getResendClient } = await import("../resend");
    const a = getResendClient();
    const b = getResendClient();

    expect(a).toBe(b);
    expect(getEnvMock).toHaveBeenCalledTimes(1);
    expect(resendCtor).toHaveBeenCalledTimes(1);
    expect(resendCtor).toHaveBeenCalledWith("re_test_123");
  });
});
