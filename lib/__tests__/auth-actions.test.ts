import { beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();
const hashMock = vi.fn(async () => "hashed-password");
const findUniqueMock = vi.fn();
const createUserMock = vi.fn();

class AuthErrorMock extends Error {}

vi.mock("@/lib/auth", () => ({ signIn: signInMock }));
vi.mock("bcryptjs", () => ({ hash: hashMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createUserMock,
    },
  },
}));
vi.mock("next-auth", () => ({ AuthError: AuthErrorMock }));

describe("auth-actions", () => {
  beforeEach(() => {
    vi.resetModules();
    signInMock.mockReset();
    hashMock.mockClear();
    findUniqueMock.mockReset();
    createUserMock.mockReset();
  });

  it("loginAction returns ok when signIn resolves", async () => {
    signInMock.mockResolvedValue(undefined);
    const { loginAction } = await import("../auth-actions");
    const result = await loginAction("User@Example.com", "123456789012");
    expect(result).toEqual({ ok: true });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "123456789012",
      redirectTo: "/compte",
    });
  });

  it("loginAction handles auth error", async () => {
    signInMock.mockRejectedValue(new AuthErrorMock("bad creds"));
    const { loginAction } = await import("../auth-actions");
    const result = await loginAction("user@example.com", "123456789012");
    expect(result.error).toContain("incorrect");
  });

  it("loginAction treats NEXT_REDIRECT as success", async () => {
    signInMock.mockRejectedValue({ digest: "NEXT_REDIRECT;xyz" });
    const { loginAction } = await import("../auth-actions");
    const result = await loginAction("user@example.com", "123456789012");
    expect(result).toEqual({ ok: true });
  });

  it("registerAction validates minimal password length", async () => {
    const { registerAction } = await import("../auth-actions");
    const result = await registerAction("user@example.com", "short");
    expect(result.error).toContain("12 caractères");
  });

  it("registerAction blocks existing account", async () => {
    findUniqueMock.mockResolvedValue({ id: "u1" });
    const { registerAction } = await import("../auth-actions");
    const result = await registerAction("user@example.com", "123456789012");
    expect(result.error).toContain("déjà");
  });

  it("registerAction creates user and returns ok when redirect is thrown", async () => {
    findUniqueMock.mockResolvedValue(null);
    createUserMock.mockResolvedValue({ id: "u1" });
    signInMock.mockRejectedValue({ digest: "NEXT_REDIRECT;to=/compte" });

    const { registerAction } = await import("../auth-actions");
    const result = await registerAction("user@example.com", "123456789012");

    expect(result).toEqual({ ok: true });
    expect(hashMock).toHaveBeenCalled();
    expect(createUserMock).toHaveBeenCalledWith({
      data: {
        email: "user@example.com",
        password: "hashed-password",
      },
    });
  });
});
