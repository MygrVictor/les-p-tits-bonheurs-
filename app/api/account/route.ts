import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/account — informations + commandes de l'utilisateur connecté */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, email: true, name: true, address: true, role: true },
  });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ user, orders });
}

/** PATCH /api/account — mise à jour nom, email, adresse */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, address } = body as {
    name?: string;
    email?: string;
    address?: string;
  };

  if (email && email !== session.user.email) {
    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id as string },
    data: {
      ...(name !== undefined && { name: name.trim() || null }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(address !== undefined && { address: address.trim() || null }),
    },
    select: { id: true, email: true, name: true, address: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      _count: { select: { orders: true } },
    },
  });

  if (!user || user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 400 },
    );
  }

  if (user._count.orders === 0) {
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return NextResponse.json({ success: true, mode: "deleted" });
  }

  const anonymizedEmail = `deleted+${userId}@deleted.local`;
  const randomPassword = await hash(randomUUID(), 12);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        password: randomPassword,
        name: null,
        address: null,
        deletedAt: new Date(),
        emailVerifiedAt: null,
      },
    }),
  ]);

  return NextResponse.json({ success: true, mode: "anonymized" });
}
