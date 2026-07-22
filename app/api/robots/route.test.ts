import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/robots", () => {
  it("returns a robots.txt payload", async () => {
    const res = GET();
    const txt = await res.text();

    expect(res.status).toBe(200);
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Sitemap:");
  });
});
