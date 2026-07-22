import { beforeEach, describe, expect, it, vi } from "vitest";

const emailCreateMock = vi.fn();
const resetCreateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailVerificationToken: { create: emailCreateMock },
    passwordResetToken: { create: resetCreateMock },
  },
}));

describe("auth token issuance", () => {
  beforeEach(() => {
    vi.resetModules();
    emailCreateMock.mockReset();
    resetCreateMock.mockReset();
  });

  it("issues email verification token and persists hash", async () => {
    const { issueEmailVerificationToken } = await import("../auth-tokens");
    const token = await issueEmailVerificationToken("user_1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
    expect(emailCreateMock).toHaveBeenCalledTimes(1);
    const payload = emailCreateMock.mock.calls[0][0].data;
    expect(payload.userId).toBe("user_1");
    expect(payload.tokenHash).toHaveLength(64);
    expect(payload.expiresAt).toBeInstanceOf(Date);
  });

  it("issues password reset token and persists hash", async () => {
    const { issuePasswordResetToken } = await import("../auth-tokens");
    const token = await issuePasswordResetToken("user_2");

    expect(typeof token).toBe("string");
    expect(resetCreateMock).toHaveBeenCalledTimes(1);
    const payload = resetCreateMock.mock.calls[0][0].data;
    expect(payload.userId).toBe("user_2");
    expect(payload.tokenHash).toHaveLength(64);
    expect(payload.expiresAt).toBeInstanceOf(Date);
  });
});
