import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailVerificationToken } from "@/lib/auth-tokens";
import { sendEmailVerification } from "@/lib/auth-notifications";

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
    select: { id: true, email: true, emailVerifiedAt: true, deletedAt: true },
  });

  if (user && !user.deletedAt && !user.emailVerifiedAt) {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });
    const token = await issueEmailVerificationToken(user.id);
    await sendEmailVerification({ email: user.email, token });
  }

  return NextResponse.json({
    success: true,
    message:
      "Si le compte est en attente, un nouvel email de confirmation a été envoyé.",
  });
}
