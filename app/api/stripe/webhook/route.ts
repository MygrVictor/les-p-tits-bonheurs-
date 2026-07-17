import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { finalizeCheckoutSession } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";

function toIntentId(
  value: string | Stripe.PaymentIntent | null,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function markPaymentFailed(params: {
  eventId: string;
  intentId: string;
}) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { stripeIntentId: params.intentId },
      select: { id: true, status: true },
    });

    if (!order) return;

    try {
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "PAYMENT_FAILED",
          stripeEventId: params.eventId,
          message: "Stripe a signalé un échec de paiement.",
          data: { intentId: params.intentId },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }

    if (order.status !== "CANCELLED") {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
    }
  });
}

async function markRefunded(params: {
  eventId: string;
  intentId: string;
  chargeId: string;
}) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { stripeIntentId: params.intentId },
      include: {
        items: {
          select: {
            productId: true,
            variantId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) return;

    try {
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "REFUNDED",
          stripeEventId: params.eventId,
          message: "Stripe a confirmé un remboursement.",
          data: {
            intentId: params.intentId,
            chargeId: params.chargeId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }

    const alreadyRestored = await tx.orderEvent.findFirst({
      where: {
        orderId: order.id,
        type: "STOCK_RESTORED",
      },
      select: { id: true },
    });

    if (!alreadyRestored) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "STOCK_RESTORED",
          message: "Stock réintégré après remboursement.",
          data: { restoredItems: order.items.length },
        },
      });
    }

    if (order.status !== "CANCELLED") {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
    }
  });
}

export async function POST(request: NextRequest) {
  const env = getEnv();
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Idempotent : si la page de confirmation a déjà créé la commande
        // (retour client sur success_url), celle-ci est simplement renvoyée.
        const result = await finalizeCheckoutSession(session.id);
        console.log("checkout.session.completed", session.id, result.status);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("payment_intent.succeeded", paymentIntent.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await markPaymentFailed({
          eventId: event.id,
          intentId: paymentIntent.id,
        });
        console.log("payment_intent.payment_failed", paymentIntent.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const intentId = toIntentId(charge.payment_intent);
        if (intentId) {
          await markRefunded({
            eventId: event.id,
            intentId,
            chargeId: charge.id,
          });
        }
        console.log("charge.refunded", charge.id, intentId ?? "no-intent");
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
