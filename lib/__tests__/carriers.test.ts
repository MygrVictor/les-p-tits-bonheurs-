import { describe, it, expect } from "vitest";
import { getCarrier, getTrackingUrl, CARRIERS } from "../carriers";

describe("getCarrier", () => {
  it("returns the carrier for a valid id", () => {
    const carrier = getCarrier("colissimo");
    expect(carrier).not.toBeNull();
    expect(carrier?.label).toContain("Colissimo");
  });

  it("returns null for an unknown id", () => {
    expect(getCarrier("unknown-carrier")).toBeNull();
    expect(getCarrier(null)).toBeNull();
    expect(getCarrier(undefined)).toBeNull();
  });

  it("all carriers have an id and label", () => {
    for (const carrier of CARRIERS) {
      expect(carrier.id).toBeTruthy();
      expect(carrier.label).toBeTruthy();
    }
  });
});

describe("getTrackingUrl", () => {
  it("returns a tracking URL for colissimo", () => {
    const url = getTrackingUrl("colissimo", "AB123456789FR");
    expect(url).toContain("laposte.fr");
    expect(url).toContain("AB123456789FR");
  });

  it("returns null when tracking number is empty", () => {
    expect(getTrackingUrl("colissimo", null)).toBeNull();
    expect(getTrackingUrl("colissimo", undefined)).toBeNull();
    expect(getTrackingUrl("colissimo", "")).toBeNull();
  });

  it("returns null for 'autre' carrier (no tracking URL)", () => {
    expect(getTrackingUrl("autre", "123456")).toBeNull();
  });

  it("returns null when carrier is unknown", () => {
    expect(getTrackingUrl("xyz", "123456")).toBeNull();
  });

  it("encodes special characters in tracking number", () => {
    const url = getTrackingUrl("ups", "AB 123 456");
    expect(url).toContain("AB%20123%20456");
  });
});
