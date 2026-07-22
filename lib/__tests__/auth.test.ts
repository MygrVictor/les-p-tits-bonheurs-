import { beforeEach, describe, expect, it, vi } from "vitest";

const compareMock = vi.fn();
const findUniqueMock = vi.fn();
const getEnvMock = vi.fn(() => ({
  ADMIN_BOOTSTRAP_EMAIL: "admin@example.com",
}));
const safeParseMock = vi.fn();
const credentialsFactoryMock = vi.fn((config: any) => ({
  ...config,
  id: "credentials",
}));

let capturedConfig: any;

vi.mock("next-auth", () => ({
  default: (config: any) => {
    capturedConfig = config;
    return {
      handlers: {},
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  },
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: credentialsFactoryMock,
}));

vi.mock("bcryptjs", () => ({ compare: compareMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
  },
}));
vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));
vi.mock("@/lib/validations/auth", () => ({
  loginSchema: {
    safeParse: safeParseMock,
  },
}));

describe("auth module", () => {
  beforeEach(() => {
    vi.resetModules();
    capturedConfig = undefined;
    compareMock.mockReset();
    findUniqueMock.mockReset();
    safeParseMock.mockReset();
  });

  it("returns bootstrap admin email from env", async () => {
    const { getBootstrapAdminEmail } = await import("../auth");
    expect(getBootstrapAdminEmail()).toBe("admin@example.com");
  });

  it("credential authorize returns null when payload invalid", async () => {
    safeParseMock.mockReturnValue({ success: false });
    await import("../auth");
    const provider = capturedConfig.providers[0];
    const result = await provider.authorize({});
    expect(result).toBeNull();
  });

  it("credential authorize returns user when all checks pass", async () => {
    safeParseMock.mockReturnValue({
      success: true,
      data: { email: "User@Example.com", password: "123456789012" },
    });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hash",
      role: "ADMIN",
      name: "Pauline",
      emailVerifiedAt: new Date(),
      deletedAt: null,
    });
    compareMock.mockResolvedValue(true);

    await import("../auth");
    const provider = capturedConfig.providers[0];
    const result = await provider.authorize({});

    expect(result).toEqual({
      id: "u1",
      email: "user@example.com",
      role: "ADMIN",
      name: "Pauline",
    });
  });

  it("credential authorize returns null when user is missing", async () => {
    safeParseMock.mockReturnValue({
      success: true,
      data: { email: "none@example.com", password: "123456789012" },
    });
    findUniqueMock.mockResolvedValue(null);

    await import("../auth");
    const provider = capturedConfig.providers[0];
    const result = await provider.authorize({});
    expect(result).toBeNull();
  });

  it("credential authorize returns null when email is not verified", async () => {
    safeParseMock.mockReturnValue({
      success: true,
      data: { email: "user@example.com", password: "123456789012" },
    });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hash",
      role: "CLIENT",
      emailVerifiedAt: null,
      deletedAt: null,
    });

    await import("../auth");
    const provider = capturedConfig.providers[0];
    const result = await provider.authorize({});
    expect(result).toBeNull();
  });

  it("credential authorize returns null when password check fails", async () => {
    safeParseMock.mockReturnValue({
      success: true,
      data: { email: "user@example.com", password: "123456789012" },
    });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      password: "hash",
      role: "CLIENT",
      emailVerifiedAt: new Date(),
      deletedAt: null,
    });
    compareMock.mockResolvedValue(false);

    await import("../auth");
    const provider = capturedConfig.providers[0];
    const result = await provider.authorize({});
    expect(result).toBeNull();
  });
});
