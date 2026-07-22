export type ShippingCountry =
  | "FR"
  | "BE"
  | "CH"
  | "LU"
  | "DE"
  | "ES"
  | "IT"
  | "CA";

type ShippingOption = {
  label: string;
  amount: number;
  eta: { minDays: number; maxDays: number };
};

const FRANCE_OPTIONS: ShippingOption[] = [
  {
    label: "Colissimo Standard",
    amount: 590,
    eta: { minDays: 2, maxDays: 4 },
  },
  {
    label: "Chronopost Express",
    amount: 1190,
    eta: { minDays: 1, maxDays: 2 },
  },
];

const EUROPE_OPTIONS: ShippingOption[] = [
  {
    label: "Colissimo International",
    amount: 990,
    eta: { minDays: 3, maxDays: 6 },
  },
  {
    label: "Express Europe",
    amount: 1490,
    eta: { minDays: 2, maxDays: 4 },
  },
];

const NORTH_AMERICA_OPTIONS: ShippingOption[] = [
  {
    label: "International Standard",
    amount: 1790,
    eta: { minDays: 5, maxDays: 9 },
  },
  {
    label: "International Express",
    amount: 2590,
    eta: { minDays: 3, maxDays: 6 },
  },
];

const COUNTRY_LABELS: Record<ShippingCountry, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  LU: "Luxembourg",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
  CA: "Canada",
};

export const ALLOWED_SHIPPING_COUNTRIES: ShippingCountry[] = [
  "FR",
  "BE",
  "CH",
  "LU",
  "DE",
  "ES",
  "IT",
  "CA",
];

/**
 * Seuil de commande (en centimes) à partir duquel les frais de port
 * standard sont offerts. Mettre à 0 pour désactiver.
 * Ex: 5000 = 50 €
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // 50 €

export function isShippingCountry(value: string): value is ShippingCountry {
  return (ALLOWED_SHIPPING_COUNTRIES as string[]).includes(value);
}

/**
 * Retourne les options d'expédition Stripe pour un pays donné.
 * Si `cartTotalCents` dépasse le seuil FREE_SHIPPING_THRESHOLD_CENTS,
 * l'option standard est proposée à 0 € (frais offerts).
 * L'option express reste toujours payante.
 */
export function getShippingOptionsForCountry(
  country: ShippingCountry,
  cartTotalCents = 0,
) {
  const options =
    country === "FR"
      ? FRANCE_OPTIONS
      : country === "CA"
        ? NORTH_AMERICA_OPTIONS
        : EUROPE_OPTIONS;

  const freeShipping =
    FREE_SHIPPING_THRESHOLD_CENTS > 0 &&
    cartTotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  return options.map((option, index) => {
    // Seule la première option (standard/économique) est offerte
    const isFree = freeShipping && index === 0;
    return {
      shipping_rate_data: {
        display_name: isFree ? `${option.label} — Offerts 🎁` : option.label,
        type: "fixed_amount" as const,
        fixed_amount: {
          amount: isFree ? 0 : option.amount,
          currency: "eur",
        },
        delivery_estimate: {
          minimum: { unit: "business_day" as const, value: option.eta.minDays },
          maximum: { unit: "business_day" as const, value: option.eta.maxDays },
        },
      },
    };
  });
}

export function getShippingCountryLabel(country: ShippingCountry): string {
  return COUNTRY_LABELS[country];
}
