import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { formatProfileAddress, parseProfileAddress } from "@/lib/address";
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
  const parsedAddress = parseProfileAddress(user?.address);

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    user: user
      ? {
          ...user,
          address: parsedAddress.address,
          postalCode: parsedAddress.postalCode,
          city: parsedAddress.city,
        }
      : null,
    orders,
  });
}

/** PATCH /api/account — mise à jour nom, email, adresse */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, address, postalCode, city } = body as {
    name?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { address: true },
  });
  const currentAddress = parseProfileAddress(currentUser?.address);

  const shouldUpdateAddress =
    address !== undefined || postalCode !== undefined || city !== undefined;
  const normalizedAddress = shouldUpdateAddress
    ? formatProfileAddress({
        address: address ?? currentAddress.address,
        postalCode: postalCode ?? currentAddress.postalCode,
        city: city ?? currentAddress.city,
      })
    : undefined;

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
      ...(normalizedAddress !== undefined && {
        address: normalizedAddress || null,
      }),
    },
    select: { id: true, email: true, name: true, address: true },
  });

  const parsedAddress = parseProfileAddress(updated.address);

  return NextResponse.json({
    user: {
      ...updated,
      address: parsedAddress.address,
      postalCode: parsedAddress.postalCode,
      city: parsedAddress.city,
    },
  });
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
