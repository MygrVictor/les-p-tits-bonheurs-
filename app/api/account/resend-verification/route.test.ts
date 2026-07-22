import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const tokenDeleteManyMock = vi.fn();
const issueEmailVerificationTokenMock = vi.fn();
const sendEmailVerificationMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    emailVerificationToken: { deleteMany: tokenDeleteManyMock },
  },
}));
vi.mock("@/lib/auth-tokens", () => ({
  issueEmailVerificationToken: issueEmailVerificationTokenMock,
}));
vi.mock("@/lib/auth-notifications", () => ({
  sendEmailVerification: sendEmailVerificationMock,
}));

describe("POST /api/account/resend-verification", () => {
  beforeEach(() => {
    vi.resetModules();
    userFindUniqueMock.mockReset();
    tokenDeleteManyMock.mockReset();
    issueEmailVerificationTokenMock.mockReset();
    sendEmailVerificationMock.mockReset();
  });

  it("returns 400 for invalid JSON or email", async () => {
    const { POST } = await import("./route");

    let res = await POST(
      new Request("http://localhost", { method: "POST", body: "{" }),
    );
    expect(res.status).toBe(400);

    res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "bad" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns generic success without issuing token for invalid state", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "u1",
      email: "client@example.com",
      emailVerifiedAt: new Date(),
      deletedAt: null,
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "client@example.com" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(issueEmailVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("issues verification token when account is pending", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "u2",
      email: "pending@example.com",
      emailVerifiedAt: null,
      deletedAt: null,
    });
    issueEmailVerificationTokenMock.mockResolvedValue("tok_2");

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "pending@example.com" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(issueEmailVerificationTokenMock).toHaveBeenCalledWith("u2");
    expect(sendEmailVerificationMock).toHaveBeenCalledWith({
      email: "pending@example.com",
      token: "tok_2",
    });
  });
});
