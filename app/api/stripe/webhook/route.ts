import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import { finalizeCheckoutSession } from "@/lib/checkout";

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
        // TODO V2: mark payment failed and keep order pending/cancelled by policy.
        console.log("payment_intent.payment_failed", paymentIntent.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // TODO V2: update payment/order refunded and reintegrate stock if needed.
        console.log("charge.refunded", charge.id);
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
