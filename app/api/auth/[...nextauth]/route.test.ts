import { describe, expect, it, vi } from "vitest";

const getHandler = vi.fn();
const postHandler = vi.fn();

vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: getHandler,
    POST: postHandler,
  },
}));

describe("/api/auth/[...nextauth]", () => {
  it("re-exports GET and POST handlers", async () => {
    const mod = await import("./route");
    expect(mod.GET).toBe(getHandler);
    expect(mod.POST).toBe(postHandler);
  });
});
