import { describe, it, expect } from "vitest";
import { parseProfileAddress, formatProfileAddress } from "../address";

describe("parseProfileAddress", () => {
  it("returns empty parts for empty value", () => {
    expect(parseProfileAddress("")).toEqual({
      address: "",
      postalCode: "",
      city: "",
    });
  });

  it("parses multiline address", () => {
    expect(parseProfileAddress("10 rue de Paris\n75001 Paris")).toEqual({
      address: "10 rue de Paris",
      postalCode: "75001",
      city: "Paris",
    });
  });

  it("parses comma-separated address with detected postal code", () => {
    expect(parseProfileAddress("10 rue Victor Hugo, 75010, Paris")).toEqual({
      address: "10 rue Victor Hugo",
      postalCode: "75010",
      city: "Paris",
    });
  });

  it("falls back to raw address when postal/city cannot be split", () => {
    expect(parseProfileAddress("Atelier artisanal")).toEqual({
      address: "Atelier artisanal",
      postalCode: "",
      city: "",
    });
  });
});

describe("formatProfileAddress", () => {
  it("formats full address", () => {
    expect(
      formatProfileAddress({
        address: " 10 rue de Paris ",
        postalCode: " 75001 ",
        city: " Paris ",
      }),
    ).toBe("10 rue de Paris, 75001, Paris");
  });

  it("returns only street when postal and city are empty", () => {
    expect(
      formatProfileAddress({
        address: "10 rue de Paris",
        postalCode: "",
        city: "",
      }),
    ).toBe("10 rue de Paris");
  });

  it("returns empty string when all parts are empty", () => {
    expect(
      formatProfileAddress({ address: "", postalCode: "", city: "" }),
    ).toBe("");
  });
});
