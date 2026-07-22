import { beforeEach, describe, expect, it, vi } from "vitest";

const hashMock = vi.fn();
const hashAuthTokenMock = vi.fn((token: string) => `h:${token}`);
const findUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const tokenUpdateMock = vi.fn();
const tokenDeleteManyMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("bcryptjs", () => ({ hash: hashMock }));
vi.mock("@/lib/auth-tokens", () => ({ hashAuthToken: hashAuthTokenMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
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

describe("POST /api/account/reset-password", () => {
  beforeEach(() => {
    vi.resetModules();
    hashMock.mockReset();
    findUniqueMock.mockReset();
    userUpdateMock.mockReset();
    tokenUpdateMock.mockReset();
    tokenDeleteManyMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (ops: any[]) => Promise.all(ops));
  });

  it("returns 400 for invalid request", async () => {
    const { POST } = await import("./route");
    let res = await POST(
      new Request("http://localhost", { method: "POST", body: "{" }),
    );
    expect(res.status).toBe(400);

    res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "short", password: "short" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid or expired token", async () => {
    findUniqueMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "a".repeat(20),
          password: "123456789012",
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("resets password successfully", async () => {
    findUniqueMock.mockResolvedValue({
      id: "t1",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    });
    hashMock.mockResolvedValue("hashed");
    userUpdateMock.mockResolvedValue({ id: "u1" });
    tokenUpdateMock.mockResolvedValue({ id: "t1" });
    tokenDeleteManyMock.mockResolvedValue({ count: 0 });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: "a".repeat(20),
          password: "123456789012",
        }),
      }),
    );
    expect(res.status).toBe(200);
  });
});
