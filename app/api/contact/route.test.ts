import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const getEnvMock = vi.fn(() => ({ RESEND_FROM: "contact@lpb.test" }));
const getResendClientMock = vi.fn(() => ({
  emails: { send: sendMock },
}));

vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));
vi.mock("@/lib/resend", () => ({ getResendClient: getResendClientMock }));

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: "{",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid payload", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", email: "bad", message: "x" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns success when payload is valid", async () => {
    sendMock.mockResolvedValue({ data: { id: "mail_1" }, error: null });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Pauline",
        email: "client@example.com",
        message: "Bonjour, je veux des infos sur un collier.",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("still returns success when resend throws", async () => {
    sendMock.mockRejectedValue(new Error("network"));
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Pauline",
        email: "client@example.com",
        message: "Message de test valide.",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
