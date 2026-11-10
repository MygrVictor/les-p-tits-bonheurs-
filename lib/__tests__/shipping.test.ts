import { describe, it, expect } from "vitest";
import {
  getShippingOptionsForCountry,
  isShippingCountry,
  ALLOWED_SHIPPING_COUNTRIES,
} from "../shipping";

describe("isShippingCountry", () => {
  it("returns true for valid shipping countries", () => {
    for (const country of ALLOWED_SHIPPING_COUNTRIES) {
      expect(isShippingCountry(country)).toBe(true);
    }
  });

  it("returns false for unsupported countries", () => {
    expect(isShippingCountry("BE")).toBe(false);
    expect(isShippingCountry("US")).toBe(false);
    expect(isShippingCountry("CN")).toBe(false);
    expect(isShippingCountry("")).toBe(false);
  });
});

describe("getShippingOptionsForCountry", () => {
  it("returns one Mondial Relay option for France", () => {
    const opts = getShippingOptionsForCountry("FR");
    expect(opts).toHaveLength(1);
    expect(opts[0].shipping_rate_data.display_name).toContain("Mondial Relay");
  });

  it("returns options with positive amounts", () => {
    for (const country of ALLOWED_SHIPPING_COUNTRIES) {
      const opts = getShippingOptionsForCountry(country);
      for (const opt of opts) {
        expect(opt.shipping_rate_data.fixed_amount.amount).toBeGreaterThan(0);
        expect(opt.shipping_rate_data.fixed_amount.currency).toBe("eur");
      }
    }
  });

  it("offers free Mondial Relay when threshold is reached", () => {
    const opts = getShippingOptionsForCountry("FR", 5000);
    expect(opts[0].shipping_rate_data.fixed_amount.amount).toBe(0);
    expect(opts[0].shipping_rate_data.display_name).toContain("Offerts");
  });
});
