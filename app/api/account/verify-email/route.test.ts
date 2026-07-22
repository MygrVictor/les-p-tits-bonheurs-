import { beforeEach, describe, expect, it, vi } from "vitest";

const hashAuthTokenMock = vi.fn((token: string) => `h:${token}`);
const findUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const tokenUpdateMock = vi.fn();
const tokenDeleteManyMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/auth-tokens", () => ({ hashAuthToken: hashAuthTokenMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailVerificationToken: {
      findUnique: findUniqueMock,
      update: tokenUpdateMock,
      deleteMany: tokenDeleteManyMock,
    },
    user: {
      update: userUpdateMock,
    },
    $transaction: transactionMock,
  },
}));

describe("GET /api/account/verify-email", () => {
  beforeEach(() => {
    vi.resetModules();
    findUniqueMock.mockReset();
    userUpdateMock.mockReset();
    tokenUpdateMock.mockReset();
    tokenDeleteManyMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (ops: any[]) => Promise.all(ops));
  });

  it("redirects to error when token is missing", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/account/verify-email"),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=verification");
  });

  it("redirects to error when token is invalid", async () => {
    findUniqueMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/account/verify-email?token=abc"),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=verification");
  });

  it("verifies email and redirects to success", async () => {
    findUniqueMock.mockResolvedValue({
      id: "t1",
      userId: "u1",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "u1" },
    });
    userUpdateMock.mockResolvedValue({ id: "u1" });
    tokenUpdateMock.mockResolvedValue({ id: "t1" });
    tokenDeleteManyMock.mockResolvedValue({ count: 0 });

    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/account/verify-email?token=abc"),
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("verified=1");
  });
});
