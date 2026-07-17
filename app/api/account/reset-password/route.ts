import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashAuthToken } from "@/lib/auth-tokens";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(12),
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
      { error: "Données invalides. Mot de passe min. 12 caractères." },
      { status: 400 },
    );
  }

  const tokenHash = hashAuthToken(parsed.data.token);
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });

  if (!token || token.consumedAt || token.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré." },
      { status: 400 },
    );
  }

  const hashed = await hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: token.userId, id: { not: token.id } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
