import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const hashMock = vi.fn();

const userFindUniqueMock = vi.fn();
const userUpdateMock = vi.fn();
const userDeleteMock = vi.fn();
const orderFindManyMock = vi.fn();
const evDeleteManyMock = vi.fn();
const prDeleteManyMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("bcryptjs", () => ({ hash: hashMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
      delete: userDeleteMock,
    },
    order: {
      findMany: orderFindManyMock,
    },
    emailVerificationToken: {
      deleteMany: evDeleteManyMock,
    },
    passwordResetToken: {
      deleteMany: prDeleteManyMock,
    },
    $transaction: transactionMock,
  },
}));

describe("/api/account", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    hashMock.mockReset();
    userFindUniqueMock.mockReset();
    userUpdateMock.mockReset();
    userDeleteMock.mockReset();
    orderFindManyMock.mockReset();
    evDeleteManyMock.mockReset();
    prDeleteManyMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async (input: any) => {
      if (Array.isArray(input)) return Promise.all(input);
      return input;
    });
  });

  it("GET returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns user profile and orders when authenticated", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "u@e.com" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u1",
      email: "u@e.com",
      name: "Nina",
      address: "10 rue de Paris, 75001, Paris",
      role: "CLIENT",
    });
    orderFindManyMock.mockResolvedValue([{ id: "o1" }]);

    const { GET } = await import("./route");
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.id).toBe("u1");
    expect(json.orders).toHaveLength(1);
  });

  it("PATCH returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Nina" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("PATCH returns 409 when email is already used", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "old@e.com" } });
    userFindUniqueMock
      .mockResolvedValueOnce({ address: "10 rue, 75001, Paris" })
      .mockResolvedValueOnce({ id: "u2", email: "taken@e.com" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "taken@e.com" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(409);
  });

  it("PATCH updates user fields", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "old@e.com" } });
    userFindUniqueMock.mockResolvedValueOnce({ address: "" });
    userUpdateMock.mockResolvedValue({
      id: "u1",
      email: "new@e.com",
      name: "Nina",
      address: "10 rue de Paris, 75001, Paris",
    });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new@e.com",
        name: "Nina",
        address: "10 rue de Paris",
        postalCode: "75001",
        city: "Paris",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(userUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("DELETE returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const { DELETE } = await import("./route");
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("DELETE returns 400 for admin accounts", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1" } });
    userFindUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      _count: { orders: 0 },
    });

    const { DELETE } = await import("./route");
    const res = await DELETE();
    expect(res.status).toBe(400);
  });

  it("DELETE hard-deletes account when user has no order", async () => {
    authMock.mockResolvedValue({ user: { id: "u3" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u3",
      role: "CLIENT",
      _count: { orders: 0 },
    });
    evDeleteManyMock.mockResolvedValue({ count: 1 });
    prDeleteManyMock.mockResolvedValue({ count: 0 });
    userDeleteMock.mockResolvedValue({ id: "u3" });

    const { DELETE } = await import("./route");
    const res = await DELETE();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.mode).toBe("deleted");
  });

  it("DELETE anonymizes account when user has orders", async () => {
    authMock.mockResolvedValue({ user: { id: "u4" } });
    userFindUniqueMock.mockResolvedValue({
      id: "u4",
      role: "CLIENT",
      _count: { orders: 2 },
    });
    hashMock.mockResolvedValue("hashed-random");
    evDeleteManyMock.mockResolvedValue({ count: 1 });
    prDeleteManyMock.mockResolvedValue({ count: 0 });
    userUpdateMock.mockResolvedValue({ id: "u4" });

    const { DELETE } = await import("./route");
    const res = await DELETE();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.mode).toBe("anonymized");
    expect(hashMock).toHaveBeenCalledTimes(1);
  });
});
