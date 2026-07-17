"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("lpb-cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("lpb-cookie-consent", "accepted");
    window.dispatchEvent(new Event("lpb-cookie-updated"));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("lpb-cookie-consent", "declined");
    window.dispatchEvent(new Event("lpb-cookie-updated"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-100 bg-white px-4 py-4 shadow-2xl sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <p className="flex-1 text-sm leading-6 text-neutral-700">
          🍪 Nous utilisons des cookies pour améliorer votre expérience. En
          continuant, vous acceptez notre{" "}
          <Link
            href="/politique-de-confidentialite"
            className="underline hover:text-blush-700"
          >
            politique de confidentialité
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
