import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export type CheckoutCartItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  name: string;
};

export type FinalizedOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: Date;
  email: string;
  items: { productName: string; quantity: number; price: number }[];
};

export type FinalizeResult =
  | { status: "unpaid" }
  | { status: "invalid" }
  | { status: "ok"; order: FinalizedOrder };

/**
 * Le panier est stocké dans les metadata Stripe sous forme de JSON,
 * potentiellement réparti sur plusieurs clés (limite Stripe : 500
 * caractères par valeur de metadata).
 */
export function chunkString(value: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += size) {
    chunks.push(value.slice(i, i + size));
  }
  return chunks;
}

export function encodeCartMetadata(
  items: CheckoutCartItem[],
): Record<string, string> {
  const json = JSON.stringify(items);
  const chunks = chunkString(json, 480);
  const metadata: Record<string, string> = {
    itemsChunks: String(chunks.length),
  };
  chunks.forEach((chunk, index) => {
    metadata[`items_${index}`] = chunk;
  });
  return metadata;
}

function decodeCartMetadata(
  metadata: Stripe.Metadata | null | undefined,
): CheckoutCartItem[] {
  if (!metadata) return [];
  const count = Number(metadata.itemsChunks ?? "0");
  if (!count || Number.isNaN(count)) return [];

  let json = "";
  for (let i = 0; i < count; i += 1) {
    json += metadata[`items_${i}`] ?? "";
  }

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as CheckoutCartItem[];
  } catch {
    return [];
  }
}

/**
 * Finalise une commande à partir d'un Stripe Checkout Session id.
 *
 * Appelée à la fois par la page de confirmation (au retour du client sur
 * success_url) et par le webhook Stripe, de façon idempotente : si une
 * commande existe déjà pour ce session id, elle est simplement renvoyée
 * plutôt que recréée. Cela rend le flux robuste même si `stripe listen`
 * n'est pas lancé pendant une démo.
 */
export async function finalizeCheckoutSession(
  sessionId: string | null | undefined,
): Promise<FinalizeResult> {
  if (!sessionId) return { status: "invalid" };

  const stripe = getStripeClient();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { status: "invalid" };
  }

  const existing = await prisma.order.findUnique({
    where: { stripePaymentId: session.id },
    include: {
      user: { select: { email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (existing) {
    return {
      status: "ok",
      order: {
        id: existing.id,
        total: existing.total,
        status: existing.status,
        createdAt: existing.createdAt,
        email: existing.user.email,
        items: existing.items.map((item) => ({
          productName: item.product?.name ?? "Produit",
          quantity: item.quantity,
          price: item.price,
        })),
      },
    };
  }

  if (session.payment_status !== "paid") {
    return { status: "unpaid" };
  }

  const email = session.customer_details?.email ?? session.metadata?.email;
  if (!email) return { status: "invalid" };

  const cartItems = decodeCartMetadata(session.metadata);
  if (cartItems.length === 0) return { status: "invalid" };

  const normalizedEmail = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const shipping = session.shipping_details ?? null;
    const address = shipping?.address
      ? [
          shipping.address.line1,
          shipping.address.line2,
          shipping.address.postal_code,
          shipping.address.city,
          shipping.address.country,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

    const randomPassword = await hash(randomUUID(), 12);
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: randomPassword,
        name: shipping?.name ?? session.customer_details?.name ?? null,
        address,
        role: "CLIENT",
      },
    });
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      total,
      status: "CONFIRMED",
      stripePaymentId: session.id,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });

  // Décrémente le stock — best effort, ne doit jamais faire échouer la
  // confirmation de commande pendant une démo.
  await Promise.all(
    cartItems.map(async (item) => {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      } catch {
        // ignore
      }
    }),
  );

  return {
    status: "ok",
    order: {
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      email: normalizedEmail,
      items: order.items.map((item) => ({
        productName: item.product?.name ?? "Produit",
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
}
