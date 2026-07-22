import { describe, it, expect } from "vitest";
import {
  CATEGORY_FILTER_CONFIGS,
  getCategoryFilterConfig,
  detectGroupValue,
} from "../category-filters";

describe("getCategoryFilterConfig", () => {
  it("finds config by exact category slug", () => {
    const config = getCategoryFilterConfig({ slug: "perlerie", parent: null });
    expect(config).not.toBeNull();
    expect(config?.slugs).toContain("perlerie");
  });

  it("finds config by parent slug", () => {
    const config = getCategoryFilterConfig({
      slug: "perlerie-charms",
      parent: { slug: "perlerie" },
    });
    expect(config).not.toBeNull();
    expect(config?.slugs).toContain("perlerie");
  });

  it("returns null when no config matches", () => {
    expect(
      getCategoryFilterConfig({ slug: "slug-inexistant", parent: null }),
    ).toBeNull();
  });
});

describe("detectGroupValue", () => {
  it("detects keyword in product name", () => {
    const group = CATEGORY_FILTER_CONFIGS.find((c) =>
      c.slugs.includes("perlerie"),
    )!.groups[0];
    const value = detectGroupValue({ name: "Perle miyuki", tags: [] }, group);
    expect(value).toBe("perles");
  });

  it("detects keyword in tags", () => {
    const group = CATEGORY_FILTER_CONFIGS.find((c) =>
      c.slugs.includes("perlerie"),
    )!.groups[0];
    const value = detectGroupValue(
      { name: "Bijou créatif", tags: ["charm"] },
      group,
    );
    expect(value).toBe("charms");
  });

  it("prioritizes longer keywords (mini pince before pince)", () => {
    const group = CATEGORY_FILTER_CONFIGS.find((c) =>
      c.slugs.includes("lifestyle-accessoires-cheveux"),
    )!.groups[0];

    const value = detectGroupValue(
      { name: "Mini pince fleur", tags: [] },
      group,
    );
    expect(value).toBe("mini-pinces");
  });

  it("returns null when nothing matches", () => {
    const group = CATEGORY_FILTER_CONFIGS.find((c) =>
      c.slugs.includes("perlerie"),
    )!.groups[0];
    const value = detectGroupValue(
      { name: "Produit inconnu", tags: ["aucun"] },
      group,
    );
    expect(value).toBeNull();
  });
});
