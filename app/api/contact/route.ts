import { NextResponse } from "next/server";
import { z } from "zod";
import { getResendClient } from "@/lib/resend";
import { getEnv } from "@/lib/env";

const schema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email(),
  message: z.string().min(5).max(5000),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Champs invalides." },
      { status: 400 },
    );
  }

  // Toujours tracé côté serveur, utile pendant la démo même si l'envoi
  // d'email réel échoue (clé Resend non configurée en prod).
  console.log("Nouveau message de contact:", parsed.data);

  try {
    const env = getEnv();
    const resend = getResendClient();
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: env.RESEND_FROM,
      replyTo: parsed.data.email,
      subject: `Nouveau message de ${parsed.data.name} (formulaire contact)`,
      text: `De : ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
    });
  } catch (error) {
    console.warn(
      "Envoi email de contact impossible (Resend non configuré) :",
      error instanceof Error ? error.message : error,
    );
  }

  return NextResponse.json({ success: true });
}




















