import { describe, it, expect } from "vitest";
import { chunkString, encodeCartMetadata } from "../checkout";

describe("chunkString", () => {
  it("splits a string into chunks of the given size", () => {
    const chunks = chunkString("abcdefgh", 3);
    expect(chunks).toEqual(["abc", "def", "gh"]);
  });

  it("returns a single chunk when string is shorter than size", () => {
    const chunks = chunkString("abc", 10);
    expect(chunks).toEqual(["abc"]);
  });

  it("returns empty array for empty string", () => {
    const chunks = chunkString("", 3);
    expect(chunks).toEqual([]);
  });
});

describe("encodeCartMetadata", () => {
  const items = [
    {
      productId: "prod_1",
      variantId: null,
      quantity: 2,
      price: 1500,
      name: "Bracelet",
    },
    {
      productId: "prod_2",
      variantId: "var_1",
      quantity: 1,
      price: 4900,
      name: "Collier",
    },
  ];

  it("encodes items into metadata keys", () => {
    const meta = encodeCartMetadata(items);
    expect(meta.itemsChunks).toBeDefined();
    expect(Number(meta.itemsChunks)).toBeGreaterThan(0);
  });

  it("produces metadata that can be decoded back", () => {
    const meta = encodeCartMetadata(items);
    const count = Number(meta.itemsChunks);
    let json = "";
    for (let i = 0; i < count; i++) {
      json += meta[`items_${i}`] ?? "";
    }
    const decoded = JSON.parse(json);
    expect(decoded).toHaveLength(items.length);
    expect(decoded[0].productId).toBe("prod_1");
    expect(decoded[1].variantId).toBe("var_1");
  });

  it("keeps values under 480 chars each", () => {
    const largeItems = Array.from({ length: 20 }, (_, i) => ({
      productId: `prod_${"x".repeat(20)}_${i}`,
      variantId: null,
      quantity: 1,
      price: 1000,
      name: `Produit ${"très long nom ".repeat(5)} ${i}`,
    }));
    const meta = encodeCartMetadata(largeItems);
    for (const [key, value] of Object.entries(meta)) {
      if (key.startsWith("items_")) {
        expect(value.length).toBeLessThanOrEqual(480);
      }
    }
  });
});
