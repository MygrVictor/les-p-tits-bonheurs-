import { beforeEach, describe, expect, it, vi } from "vitest";

const hashMock = vi.fn();
const findUniqueMock = vi.fn();
const createUserMock = vi.fn();
const issueEmailVerificationTokenMock = vi.fn();
const sendEmailVerificationMock = vi.fn();

vi.mock("bcryptjs", () => ({ hash: hashMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createUserMock,
    },
  },
}));
vi.mock("@/lib/auth-tokens", () => ({
  issueEmailVerificationToken: issueEmailVerificationTokenMock,
}));
vi.mock("@/lib/auth-notifications", () => ({
  sendEmailVerification: sendEmailVerificationMock,
}));

describe("POST /api/account/register", () => {
  beforeEach(() => {
    vi.resetModules();
    hashMock.mockReset();
    findUniqueMock.mockReset();
    createUserMock.mockReset();
    issueEmailVerificationTokenMock.mockReset();
    sendEmailVerificationMock.mockReset();
  });

  it("returns 400 for invalid payload", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/account/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "short" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when account already exists", async () => {
    findUniqueMock.mockResolvedValue({ id: "u1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/account/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "123456789012",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates account and sends verification email", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed");
    createUserMock.mockResolvedValue({ id: "u2", email: "client@example.com" });
    issueEmailVerificationTokenMock.mockResolvedValue("tok_1");
    sendEmailVerificationMock.mockResolvedValue(true);

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/account/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "CLIENT@EXAMPLE.COM",
        password: "123456789012",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(createUserMock).toHaveBeenCalledWith({
      data: { email: "client@example.com", password: "hashed" },
    });
    expect(sendEmailVerificationMock).toHaveBeenCalledWith({
      email: "client@example.com",
      token: "tok_1",
    });
  });

  it("returns 500 on unexpected error", async () => {
    findUniqueMock.mockRejectedValue(new Error("db down"));
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/account/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "123456789012",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
