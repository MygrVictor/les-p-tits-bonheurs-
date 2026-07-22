import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { sendOrderConfirmation } from "@/lib/order-notifications";

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    user: { select: { email: true } };
    items: { include: { product: { select: { name: true } } } };
  };
}>;

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
  const shipping = session.shipping_details ?? null;
  const metadataShippingName = session.metadata?.shippingName ?? null;
  const metadataShippingAddress = session.metadata?.shippingAddress ?? null;
  const metadataShippingPostalCode = session.metadata?.shippingPostalCode ?? null;
  const metadataShippingCity = session.metadata?.shippingCity ?? null;
  const shippingAddress = shipping?.address
    ? [
        shipping.address.line1,
        shipping.address.line2,
        shipping.address.postal_code,
        shipping.address.city,
        shipping.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : metadataShippingAddress
      ? [
          metadataShippingAddress,
          metadataShippingPostalCode,
          metadataShippingCity,
          shipping?.address?.country ?? session.metadata?.shippingCountry,
        ]
          .filter(Boolean)
          .join(", ")
      : null;
  const stripeIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  let created = false;
  let order: OrderWithDetails | null = null;

  try {
    const txOrder = await prisma.$transaction(async (tx) => {
      const already = await tx.order.findUnique({
        where: { stripePaymentId: session.id },
        include: {
          user: { select: { email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });
      if (already) return already;

      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        const randomPassword = await hash(randomUUID(), 12);
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: randomPassword,
            name:
              shipping?.name ?? metadataShippingName ?? session.customer_details?.name ?? null,
            address: shippingAddress,
            role: "CLIENT",
            emailVerifiedAt: new Date(),
          },
        });
      } else if (!user.emailVerifiedAt) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: new Date(),
            ...(shipping?.name || metadataShippingName
              ? {
                  name:
                    shipping?.name ?? metadataShippingName ?? user.name ?? null,
                }
              : {}),
            ...(shippingAddress
              ? { address: shippingAddress }
              : user.address
                ? { address: user.address }
                : {}),
          },
        });
      }

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, stock: true, status: true },
        });

        if (!product || product.status !== "ACTIVE") {
          throw new Error("PRODUCT_UNAVAILABLE");
        }

        if (product.stock < item.quantity) {
          throw new Error("PRODUCT_OUT_OF_STOCK");
        }

        if (item.variantId) {
          const variant = await tx.productVariant.findFirst({
            where: { id: item.variantId, productId: item.productId },
            select: { id: true, stock: true },
          });

          if (!variant || variant.stock < item.quantity) {
            throw new Error("VARIANT_OUT_OF_STOCK");
          }
        }
      }

      const total =
        typeof session.amount_total === "number"
          ? session.amount_total
          : cartItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );

      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          status: "CONFIRMED",
          stripePaymentId: session.id,
          stripeIntentId,
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
          user: { select: { email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });

      for (const item of cartItems) {
        const productStockUpdated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (productStockUpdated.count !== 1) {
          throw new Error("PRODUCT_STOCK_RACE");
        }

        if (item.variantId) {
          const variantStockUpdated = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (variantStockUpdated.count !== 1) {
            throw new Error("VARIANT_STOCK_RACE");
          }
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          type: "ORDER_CONFIRMED",
          message: "Paiement confirmé et stock décrémenté.",
          data: {
            sessionId: session.id,
            paymentIntentId: stripeIntentId,
          },
        },
      });

      created = true;
      return newOrder;
    });

    order = txOrder;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.order.findUnique({
        where: { stripePaymentId: session.id },
        include: {
          user: { select: { email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });
      if (duplicate) {
        order = duplicate;
      }
    } else {
      console.error("[finalizeCheckoutSession] transaction failed:", error);
      return { status: "invalid" };
    }
  }

  if (!order) {
    return { status: "invalid" };
  }

  // Email de confirmation — envoyé une seule fois ici, au moment exact de
  // la création réelle de la commande (pas à chaque relecture idempotente
  // ci-dessus, sinon on spammerait le client à chaque appel de cette
  // fonction). "Best effort" : ne doit jamais faire échouer la commande.
  if (created) {
    await sendOrderConfirmation({
      email: normalizedEmail,
      orderId: order.id,
      total: order.total,
      items: order.items.map((item) => ({
        productName: item.product?.name ?? "Produit",
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }

  return {
    status: "ok",
    order: {
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      email: order.user.email,
      items: order.items.map((item) => ({
        productName: item.product?.name ?? "Produit",
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
}
