import { getEnv } from "@/lib/env";
import { getResendClient } from "@/lib/resend";

export async function sendEmailVerification(params: {
  email: string;
  token: string;
}): Promise<boolean> {
  try {
    const env = getEnv();
    const resend = getResendClient();
    const verifyUrl = `${env.NEXTAUTH_URL}/api/account/verify-email?token=${encodeURIComponent(params.token)}`;

    const result = await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.email,
      subject: "Confirmez votre email — Les P'tits Bonheurs",
      text: [
        "Bienvenue ✨",
        "",
        "Confirmez votre adresse email pour activer votre compte :",
        verifyUrl,
        "",
        "Ce lien expire dans 24 heures.",
      ].join("\n"),
    });

    if (result.error) {
      console.warn(
        "[sendEmailVerification] Resend a refusé l'envoi:",
        result.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "[sendEmailVerification] Envoi impossible:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
}): Promise<boolean> {
  try {
    const env = getEnv();
    const resend = getResendClient();
    const resetUrl = `${env.NEXTAUTH_URL}/compte/reinitialiser?token=${encodeURIComponent(params.token)}`;

    const result = await resend.emails.send({
      from: env.RESEND_FROM,
      to: params.email,
      subject: "Réinitialiser votre mot de passe",
      text: [
        "Vous avez demandé une réinitialisation de mot de passe.",
        "",
        "Lien sécurisé :",
        resetUrl,
        "",
        "Ce lien expire dans 30 minutes.",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      ].join("\n"),
    });

    if (result.error) {
      console.warn(
        "[sendPasswordResetEmail] Resend a refusé l'envoi:",
        result.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "[sendPasswordResetEmail] Envoi impossible:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
