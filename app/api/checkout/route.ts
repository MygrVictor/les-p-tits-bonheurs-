import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { encodeCartMetadata, type CheckoutCartItem } from "@/lib/checkout";
import {
  ALLOWED_SHIPPING_COUNTRIES,
  getShippingOptionsForCountry,
  isShippingCountry,
} from "@/lib/shipping";

export const runtime = "nodejs";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  email: z.string().email().optional(),
  shippingCountry: z.string().length(2),
});

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Panier invalide. Rechargez la page et réessayez." },
      { status: 400 },
    );
  }

  const session = await auth();
  const email = session?.user?.email ?? parsed.data.email;
  const shippingCountry = parsed.data.shippingCountry.toUpperCase();

  if (!isShippingCountry(shippingCountry)) {
    return NextResponse.json(
      { error: "Pays de livraison non pris en charge." },
      { status: 400 },
    );
  }

  const lineItems: {
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; images: string[] };
    };
    quantity: number;
  }[] = [];
  const metaItems: CheckoutCartItem[] = [];

  for (const entry of parsed.data.items) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: entry.productId }, { slug: entry.productId }],
        status: "ACTIVE",
      },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Un article de votre panier n'est plus disponible." },
        { status: 400 },
      );
    }

    let unitPrice = product.salePrice ?? product.price;
    let availableStock = product.stock;
    let variantId: string | null = null;

    if (entry.variantId) {
      const variant = product.variants.find((v) => v.id === entry.variantId);
      if (variant) {
        variantId = variant.id;
        availableStock = variant.stock;
        if (variant.price) unitPrice = variant.price;
      }
    }

    if (availableStock < entry.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuffisant pour "${product.name}" (${availableStock} disponible${availableStock > 1 ? "s" : ""}).`,
        },
        { status: 400 },
      );
    }

    const images = toStringArray(product.images).filter((img) =>
      /^https?:\/\//i.test(img),
    );

    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: unitPrice,
        product_data: {
          name: product.name,
          images: images.slice(0, 1),
        },
      },
      quantity: entry.quantity,
    });

    metaItems.push({
      productId: product.id,
      variantId,
      quantity: entry.quantity,
      price: unitPrice,
      name: product.name,
    });
  }

  const stripe = getStripeClient();
  const origin =
    request.headers.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const metadata = encodeCartMetadata(metaItems);
  if (email) metadata.email = email;
  metadata.shippingCountry = shippingCountry;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      ...(email ? { customer_email: email } : {}),
      locale: "fr",
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ALLOWED_SHIPPING_COUNTRIES,
      },
      shipping_options: getShippingOptionsForCountry(shippingCountry),
      metadata,
      success_url: `${origin}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Erreur création session Stripe:", error);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement Stripe." },
      { status: 500 },
    );
  }
}
