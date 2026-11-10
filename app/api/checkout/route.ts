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
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  address: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  shippingCountry: z.string().length(2),
  relayPoint: z.object({
    id: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(160),
    address: z.string().trim().min(1).max(200),
    postalCode: z.string().trim().min(1).max(20),
    city: z.string().trim().min(1).max(100),
    country: z.string().length(2),
  }),
});

function getPublicSiteUrl(request: Request): string {
  const configured =
    process.env.SITE_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured;
  return new URL(request.url).origin;
}

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

  const relayCountry = parsed.data.relayPoint.country.toUpperCase();
  if (shippingCountry !== "FR" || relayCountry !== "FR") {
    return NextResponse.json(
      {
        error:
          "La livraison Mondial Relay est disponible en France uniquement.",
      },
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
  const siteUrl = getPublicSiteUrl(request);

  const cartTotalCents = metaItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const metadata = encodeCartMetadata(metaItems);
  metadata.email = email;
  metadata.shippingCountry = shippingCountry;
  metadata.shippingName =
    `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  metadata.shippingAddress = parsed.data.address;
  metadata.shippingPostalCode = parsed.data.postalCode;
  metadata.shippingCity = parsed.data.city;
  metadata.relayId = parsed.data.relayPoint.id;
  metadata.relayName = parsed.data.relayPoint.name;
  metadata.relayAddress = parsed.data.relayPoint.address;
  metadata.relayPostalCode = parsed.data.relayPoint.postalCode;
  metadata.relayCity = parsed.data.relayPoint.city;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      ...(email ? { customer_email: email } : {}),
      locale: "fr",
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      shipping_options: getShippingOptionsForCountry(
        shippingCountry,
        cartTotalCents,
      ),
      metadata,
      success_url: `${siteUrl}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
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
