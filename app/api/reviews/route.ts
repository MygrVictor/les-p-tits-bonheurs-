import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

/** GET /api/reviews?productId=xxx — avis approuvés pour un produit */
export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId requis." }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      product: { OR: [{ id: productId }, { slug: productId }] },
      approved: true,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ reviews });
}

/** POST /api/reviews — soumettre un avis (utilisateur connecté uniquement) */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour laisser un avis." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: parsed.data.productId }, { slug: parsed.data.productId }],
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Produit introuvable." },
      { status: 404 },
    );
  }

  const existing = await prisma.review.findFirst({
    where: { productId: product.id, userId: session.user.id as string },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà soumis un avis pour ce produit." },
      { status: 409 },
    );
  }

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: session.user.id as string,
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
      approved: false,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "Avis soumis. Il sera publié après modération.",
    },
    { status: 201 },
  );
}
