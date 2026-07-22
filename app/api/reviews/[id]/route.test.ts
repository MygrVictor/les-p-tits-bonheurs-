import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const reviewUpdateMock = vi.fn();
const reviewDeleteMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      update: reviewUpdateMock,
      delete: reviewDeleteMock,
    },
  },
}));

describe("/api/reviews/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    reviewUpdateMock.mockReset();
    reviewDeleteMock.mockReset();
  });

  it("PATCH denies non-admin", async () => {
    authMock.mockResolvedValue({ user: { role: "CLIENT" } });
    const { PATCH } = await import("./route");
    const res = await PATCH(new Request("http://localhost"), {
      params: { id: "r1" },
    });
    expect(res.status).toBe(403);
  });

  it("PATCH approves review for admin", async () => {
    authMock.mockResolvedValue({ user: { role: "ADMIN" } });
    reviewUpdateMock.mockResolvedValue({ id: "r1" });
    const { PATCH } = await import("./route");
    const res = await PATCH(new Request("http://localhost"), {
      params: { id: "r1" },
    });
    expect(res.status).toBe(200);
  });

  it("DELETE deletes review for admin", async () => {
    authMock.mockResolvedValue({ user: { role: "ADMIN" } });
    reviewDeleteMock.mockResolvedValue({ id: "r1" });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), {
      params: { id: "r1" },
    });
    expect(res.status).toBe(200);
  });
});
