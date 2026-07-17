"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("lpb-cookie-consent");
    if (consent === "accepted") setConsented(true);

    const handler = () => {
      const updated = localStorage.getItem("lpb-cookie-consent");
      if (updated === "accepted") setConsented(true);
    };

    window.addEventListener("lpb-cookie-updated", handler);
    return () => window.removeEventListener("lpb-cookie-updated", handler);
  }, []);

  if (!consented || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

/** Envoie un event e-commerce à GA4. */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/** Événements e-commerce standard GA4 */
export function trackViewItem(item: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}) {
  trackEvent("view_item", {
    currency: "EUR",
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category,
        item_brand: item.brand,
      },
    ],
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  trackEvent("add_to_cart", {
    currency: "EUR",
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

export function trackPurchase(params: {
  orderId: string;
  total: number;
  items: { id: string; name: string; price: number; quantity: number }[];
}) {
  trackEvent("purchase", {
    transaction_id: params.orderId,
    currency: "EUR",
    value: params.total / 100,
    items: params.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price / 100,
      quantity: item.quantity,
    })),
  });
}
