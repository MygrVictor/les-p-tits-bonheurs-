import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/auth-notifications";

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, deletedAt: true, emailVerifiedAt: true },
  });

  if (user && !user.deletedAt) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });
    const token = await issuePasswordResetToken(user.id);
    await sendPasswordResetEmail({ email: user.email, token });
  }

  return NextResponse.json({
    success: true,
    message:
      "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
  });
}
