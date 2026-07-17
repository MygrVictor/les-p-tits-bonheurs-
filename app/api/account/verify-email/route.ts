import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashAuthToken } from "@/lib/auth-tokens";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(
      new URL("/compte?tab=login&error=verification", request.url),
    );
  }

  const tokenHash = hashAuthToken(token);

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !verification ||
    verification.consumedAt !== null ||
    verification.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.redirect(
      new URL("/compte?tab=login&error=verification", request.url),
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        userId: verification.userId,
        consumedAt: null,
        id: { not: verification.id },
      },
    }),
  ]);

  return NextResponse.redirect(
    new URL("/compte?tab=login&verified=1", request.url),
  );
}
