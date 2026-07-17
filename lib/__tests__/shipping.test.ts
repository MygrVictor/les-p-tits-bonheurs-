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
    expect(isShippingCountry("US")).toBe(false);
    expect(isShippingCountry("CN")).toBe(false);
    expect(isShippingCountry("")).toBe(false);
  });
});

describe("getShippingOptionsForCountry", () => {
  it("returns 2 options for France", () => {
    const opts = getShippingOptionsForCountry("FR");
    expect(opts).toHaveLength(2);
    expect(opts[0].shipping_rate_data.display_name).toContain("Colissimo");
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

  it("returns different options for Canada vs France", () => {
    const fr = getShippingOptionsForCountry("FR");
    const ca = getShippingOptionsForCountry("CA");
    expect(fr[0].shipping_rate_data.display_name).not.toBe(
      ca[0].shipping_rate_data.display_name,
    );
  });

  it("returns Europe options for BE, CH, LU, DE, ES, IT", () => {
    const europeanCountries = ["BE", "CH", "LU", "DE", "ES", "IT"] as const;
    for (const country of europeanCountries) {
      const opts = getShippingOptionsForCountry(country);
      expect(opts[0].shipping_rate_data.display_name).toContain(
        "International",
      );
    }
  });
});
