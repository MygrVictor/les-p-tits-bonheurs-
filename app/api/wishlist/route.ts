import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  productId: z.string().min(1),
});

/** GET /api/wishlist — liste de la wishlist de l'utilisateur connecté */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id as string },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          salePrice: true,
          images: true,
          status: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

/** POST /api/wishlist — ajouter un produit */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "productId requis." }, { status: 400 });
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

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: session.user.id as string,
        productId: product.id,
      },
    },
    create: {
      userId: session.user.id as string,
      productId: product.id,
    },
    update: {},
  });

  return NextResponse.json({ success: true });
}

/** DELETE /api/wishlist?productId=xxx — retirer un produit */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const productId = new URL(req.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId requis." }, { status: 400 });
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      userId: session.user.id as string,
      product: { OR: [{ id: productId }, { slug: productId }] },
    },
  });

  return NextResponse.json({ success: true });
}
