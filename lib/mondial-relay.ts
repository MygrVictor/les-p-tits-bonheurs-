export type RelayPoint = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: "FR";
};

type SearchRelayParams = {
  postalCode: string;
  city: string;
  country?: string;
};

function toRelayPoints(input: unknown): RelayPoint[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;

      const id = String(row.id ?? row.relayId ?? "").trim();
      const name = String(row.name ?? row.label ?? "").trim();
      const address = String(row.address ?? row.address1 ?? "").trim();
      const postalCode = String(
        row.postalCode ?? row.cp ?? row.zip ?? "",
      ).trim();
      const city = String(row.city ?? row.ville ?? "").trim();
      const country = String(row.country ?? "FR").toUpperCase();

      if (
        !id ||
        !name ||
        !address ||
        !postalCode ||
        !city ||
        country !== "FR"
      ) {
        return null;
      }

      return {
        id,
        name,
        address,
        postalCode,
        city,
        country: "FR" as const,
      };
    })
    .filter((point): point is RelayPoint => point !== null);
}

function getMockRelayPoints(postalCode: string, city: string): RelayPoint[] {
  const cp = postalCode.trim() || "75001";
  const normalizedCity = city.trim() || "Paris";

  return [
    {
      id: `MR-${cp}-A`,
      name: `Point Relais ${normalizedCity} Centre`,
      address: "12 rue des Lilas",
      postalCode: cp,
      city: normalizedCity,
      country: "FR",
    },
    {
      id: `MR-${cp}-B`,
      name: `Point Relais ${normalizedCity} Gare`,
      address: "5 avenue de la Gare",
      postalCode: cp,
      city: normalizedCity,
      country: "FR",
    },
    {
      id: `MR-${cp}-C`,
      name: `Point Relais ${normalizedCity} Marché`,
      address: "18 place du Marché",
      postalCode: cp,
      city: normalizedCity,
      country: "FR",
    },
  ];
}

function shouldUseMockData(): boolean {
  const explicit = process.env.MONDIAL_RELAY_USE_MOCK;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

async function fetchRelayPointsFromProvider(
  postalCode: string,
  city: string,
): Promise<RelayPoint[] | null> {
  const providerUrl = process.env.MONDIAL_RELAY_API_URL;
  const apiKey = process.env.MONDIAL_RELAY_API_KEY;

  if (!providerUrl || !apiKey) {
    return null;
  }

  const url = new URL(providerUrl);
  url.searchParams.set("postalCode", postalCode);
  url.searchParams.set("city", city);
  url.searchParams.set("country", "FR");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  if (process.env.MONDIAL_RELAY_ENSEIGNE) {
    headers["x-mondial-relay-enseigne"] = process.env.MONDIAL_RELAY_ENSEIGNE;
  }

  if (process.env.MONDIAL_RELAY_PRIVATE_KEY) {
    headers["x-mondial-relay-private-key"] =
      process.env.MONDIAL_RELAY_PRIVATE_KEY;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`MONDIAL_RELAY_PROVIDER_HTTP_${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const points = Array.isArray(payload)
    ? toRelayPoints(payload)
    : toRelayPoints((payload as { points?: unknown })?.points ?? []);

  return points;
}

export async function searchRelayPoints(
  params: SearchRelayParams,
): Promise<{ points: RelayPoint[]; source: "provider" | "mock" }> {
  const postalCode = params.postalCode.trim();
  const city = params.city.trim();
  const country = (params.country ?? "FR").toUpperCase();

  if (!postalCode || !city || country !== "FR") {
    return { points: [], source: "mock" };
  }

  try {
    const providerPoints = await fetchRelayPointsFromProvider(postalCode, city);
    if (providerPoints) {
      return { points: providerPoints, source: "provider" };
    }
  } catch (error) {
    console.error("[mondial-relay] provider lookup failed", error);
    if (!shouldUseMockData()) {
      throw error;
    }
  }

  return { points: getMockRelayPoints(postalCode, city), source: "mock" };
}
