import { beforeEach, describe, expect, it, vi } from "vitest";

const userFindUniqueMock = vi.fn();
const tokenDeleteManyMock = vi.fn();
const issuePasswordResetTokenMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    passwordResetToken: { deleteMany: tokenDeleteManyMock },
  },
}));
vi.mock("@/lib/auth-tokens", () => ({
  issuePasswordResetToken: issuePasswordResetTokenMock,
}));
vi.mock("@/lib/auth-notifications", () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

describe("POST /api/account/forgot-password", () => {
  beforeEach(() => {
    vi.resetModules();
    userFindUniqueMock.mockReset();
    tokenDeleteManyMock.mockReset();
    issuePasswordResetTokenMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
  });

  it("returns 400 for invalid JSON or invalid email", async () => {
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

  it("returns generic success even when user does not exist", async () => {
    userFindUniqueMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "none@example.com" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(issuePasswordResetTokenMock).not.toHaveBeenCalled();
  });

  it("issues reset token and sends email for active user", async () => {
    userFindUniqueMock.mockResolvedValue({
      id: "u1",
      email: "client@example.com",
      deletedAt: null,
      emailVerifiedAt: new Date(),
    });
    issuePasswordResetTokenMock.mockResolvedValue("tok_1");
    sendPasswordResetEmailMock.mockResolvedValue(true);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "client@example.com" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(issuePasswordResetTokenMock).toHaveBeenCalledWith("u1");
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith({
      email: "client@example.com",
      token: "tok_1",
    });
  });
});
