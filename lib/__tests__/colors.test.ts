import { describe, it, expect } from "vitest";
import { PRODUCT_COLORS, getProductColor } from "../colors";

describe("colors", () => {
  it("contains expected palette entries", () => {
    expect(PRODUCT_COLORS.length).toBeGreaterThan(10);
    expect(PRODUCT_COLORS.some((c) => c.id === "multicolore")).toBe(true);
  });

  it("returns null for unknown or empty ids", () => {
    expect(getProductColor("")).toBeNull();
    expect(getProductColor(undefined)).toBeNull();
    expect(getProductColor("inconnue")).toBeNull();
  });

  it("returns matching color for known id", () => {
    expect(getProductColor("bleu")?.label).toBe("Bleu");
  });
});
