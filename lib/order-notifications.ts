import { getResendClient } from "@/lib/resend";
import { getEnv } from "@/lib/env";
import { getCarrier, getTrackingUrl } from "@/lib/carriers";

/**
 * Email envoyé au client quand l'admin renseigne (ou modifie) le numéro
 * de suivi d'une commande, depuis /admin/commandes — voir updateOrderStatus
 * dans app/(admin)/admin/actions.ts.
 *
 * "Best effort" comme le formulaire de contact (app/api/contact/route.ts) :
 * une erreur d'envoi (clé Resend absente/invalide, domaine non vérifié en
 * mode test…) ne doit jamais faire planter la mise à jour de la commande
 * côté admin, juste être tracée côté serveur.
 */
export async function sendShippingNotification(params: {
  email: string;
  orderId: string;
  carrier: string | null;
  trackingNumber: string;
}): Promise<boolean> {
  const orderRef = params.orderId.slice(-6).toUpperCase();
  const carrier = getCarrier(params.carrier);
  const trackingUrl = getTrackingUrl(params.carrier, params.trackingNumber);
  const carrierLabel = carrier?.label ?? "notre transporteur";

  const lines = [
    `Bonne nouvelle ! Votre commande #${orderRef} vient d'être expédiée par ${carrierLabel}.`,
    "",
    `Numéro de suivi : ${params.trackingNumber}`,
  ];

  if (trackingUrl) {
    lines.push("", `Suivre mon colis : ${trackingUrl}`);
  }

  lines.push("", "Merci pour votre confiance,", "Les P'tits Bonheurs");

  try {
    const env = getEnv();
    const resend = getResendClient();
    // Le SDK Resend ne lève PAS d'exception pour une erreur API (clé
    // invalide, domaine non vérifié, destinataire refusé…) : il résout
    // normalement avec `{ data: null, error: {...} }`. Un simple try/catch
    // ne suffit donc pas — il faut explicitement vérifier `result.error`,
    // sinon on croit à tort que l'email est parti.
    const result = await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.email,
      subject: `Votre commande #${orderRef} a été expédiée 📦`,
      text: lines.join("\n"),
    });

    if (result.error) {
      console.warn(
        "[sendShippingNotification] Resend a refusé l'envoi :",
        result.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "[sendShippingNotification] Envoi email impossible (Resend non configuré ?) :",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Email envoyé au client juste après une commande payée avec succès —
 * appelée depuis finalizeCheckoutSession() (lib/checkout.ts), donc à la
 * fois au retour du client sur la page de confirmation ET depuis le
 * webhook Stripe. Idempotent au niveau appelant : finalizeCheckoutSession
 * ne (re)crée jamais deux fois la même commande, donc cette fonction n'est
 * appelée qu'une seule fois par commande réelle.
 */
export async function sendOrderConfirmation(params: {
  email: string;
  orderId: string;
  total: number;
  items: { productName: string; quantity: number; price: number }[];
}): Promise<boolean> {
  const orderRef = params.orderId.slice(-6).toUpperCase();

  const itemLines = params.items.map(
    (item) =>
      `- ${item.productName} × ${item.quantity} — ${((item.price * item.quantity) / 100).toFixed(2)} €`,
  );

  const lines = [
    `Merci pour votre commande #${orderRef} !`,
    "",
    "Récapitulatif :",
    ...itemLines,
    "",
    `Total : ${(params.total / 100).toFixed(2)} €`,
    "",
    "Nous préparons votre colis avec soin. Vous recevrez un nouvel email dès",
    "qu'il sera expédié, avec le numéro de suivi.",
    "",
    "Merci pour votre confiance,",
    "Les P'tits Bonheurs",
  ];

  try {
    const env = getEnv();
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.email,
      subject: `Votre commande #${orderRef} est confirmée ✨`,
      text: lines.join("\n"),
    });

    if (result.error) {
      console.warn(
        "[sendOrderConfirmation] Resend a refusé l'envoi :",
        result.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "[sendOrderConfirmation] Envoi email impossible (Resend non configuré ?) :",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
