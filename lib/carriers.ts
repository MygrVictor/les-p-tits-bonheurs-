/**
 * Transporteurs proposés dans l'admin pour le suivi de colis (voir
 * updateOrderStatus dans app/(admin)/admin/actions.ts). Texte libre en
 * base (Order.carrier), pas de FK : une simple liste de référence suffit
 * pour ce besoin, pas besoin d'une table dédiée.
 *
 * `trackingUrl` construit un lien cliquable direct vers la page de suivi
 * du transporteur à partir du numéro saisi par l'admin. Absent pour
 * "Autre transporteur" (numéro affiché en texte seul, sans lien fiable).
 */
export type Carrier = {
  id: string;
  label: string;
  trackingUrl?: (code: string) => string;
};

export const CARRIERS: Carrier[] = [
  {
    id: "colissimo",
    label: "Colissimo (La Poste)",
    trackingUrl: (code) =>
      `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(code)}`,
  },
  {
    id: "chronopost",
    label: "Chronopost",
    trackingUrl: (code) =>
      `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(code)}`,
  },
  {
    id: "mondial-relay",
    label: "Mondial Relay",
    trackingUrl: (code) =>
      `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${encodeURIComponent(code)}`,
  },
  {
    id: "ups",
    label: "UPS",
    trackingUrl: (code) =>
      `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`,
  },
  {
    id: "dpd",
    label: "DPD",
    trackingUrl: (code) =>
      `https://trace.dpd.fr/fr/trace/${encodeURIComponent(code)}`,
  },
  {
    id: "gls",
    label: "GLS",
    trackingUrl: (code) =>
      `https://gls-group.eu/FR/fr/suivi-colis?match=${encodeURIComponent(code)}`,
  },
  {
    id: "colis-prive",
    label: "Colis Privé",
    trackingUrl: (code) =>
      `https://www.colisprive.com/moncolis/pages/detailColis.aspx?numColis=${encodeURIComponent(code)}`,
  },
  {
    id: "autre",
    label: "Autre transporteur",
  },
];

export function getCarrier(id: string | null | undefined): Carrier | null {
  if (!id) return null;
  return CARRIERS.find((carrier) => carrier.id === id) ?? null;
}

export function getTrackingUrl(
  carrierId: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!trackingNumber) return null;
  const carrier = getCarrier(carrierId);
  if (!carrier?.trackingUrl) return null;
  return carrier.trackingUrl(trackingNumber);
}
