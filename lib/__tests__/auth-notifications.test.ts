import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const getEnvMock = vi.fn(() => ({
  NEXTAUTH_URL: "https://boutique.example.com",
  RESEND_FROM: "noreply@boutique.example.com",
}));
const getResendClientMock = vi.fn(() => ({
  emails: {
    send: sendMock,
  },
}));

vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));
vi.mock("@/lib/resend", () => ({ getResendClient: getResendClientMock }));

describe("auth-notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    getEnvMock.mockClear();
    getResendClientMock.mockClear();
  });

  it("sends verification email and returns true on success", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
    const { sendEmailVerification } = await import("../auth-notifications");
    const ok = await sendEmailVerification({
      email: "client@example.com",
      token: "abc/def",
    });

    expect(ok).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("client@example.com");
    expect(payload.text).toContain(
      "https://boutique.example.com/api/account/verify-email?token=abc%2Fdef",
    );
  });

  it("returns false when resend returns an API error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "blocked" } });
    const { sendEmailVerification } = await import("../auth-notifications");
    const ok = await sendEmailVerification({
      email: "client@example.com",
      token: "abc",
    });
    expect(ok).toBe(false);
  });

  it("sends reset email and returns false on exception", async () => {
    sendMock.mockRejectedValue(new Error("network"));
    const { sendPasswordResetEmail } = await import("../auth-notifications");
    const ok = await sendPasswordResetEmail({
      email: "client@example.com",
      token: "tok-1",
    });

    expect(ok).toBe(false);
  });

  it("sends reset email and returns true on success", async () => {
    sendMock.mockResolvedValue({ data: { id: "m1" }, error: null });
    const { sendPasswordResetEmail } = await import("../auth-notifications");
    const ok = await sendPasswordResetEmail({
      email: "client@example.com",
      token: "tok-2",
    });

    expect(ok).toBe(true);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.text).toContain("/compte/reinitialiser?token=tok-2");
  });
});
