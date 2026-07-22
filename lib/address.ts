export type ProfileAddressParts = {
  address: string;
  postalCode: string;
  city: string;
};

const POSTAL_CODE_RE = /^\d{4,6}(?:[\s-]?[A-Za-z0-9]+)?$/;

export function parseProfileAddress(
  value: string | null | undefined,
): ProfileAddressParts {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return { address: "", postalCode: "", city: "" };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    const match = lines[1].match(/^(\S+)\s+(.+)$/);
    if (match) {
      return {
        address: lines[0],
        postalCode: match[1],
        city: match[2],
      };
    }
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const postalIndex = parts.findIndex((part) => POSTAL_CODE_RE.test(part));
    if (postalIndex >= 0 && postalIndex + 1 < parts.length) {
      return {
        address: parts.slice(0, postalIndex).join(", "),
        postalCode: parts[postalIndex],
        city: parts[postalIndex + 1],
      };
    }

    return {
      address: parts.slice(0, -2).join(", "),
      postalCode: parts[parts.length - 2],
      city: parts[parts.length - 1],
    };
  }

  return { address: raw, postalCode: "", city: "" };
}

export function formatProfileAddress(parts: ProfileAddressParts): string {
  const address = parts.address.trim();
  const postalCode = parts.postalCode.trim();
  const city = parts.city.trim();

  if (!address && !postalCode && !city) return "";
  if (!postalCode && !city) return address;

  return [address, postalCode, city].filter(Boolean).join(", ");
}
