"use client";

import { useState } from "react";
import { UserRound, ArrowRight, ChevronDown } from "lucide-react";
import { AuthTabs } from "@/components/store/auth-tabs";

export function CheckoutGate({
  onContinueAsGuest,
}: {
  onContinueAsGuest: () => void;
}) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Avant de continuer
        </p>
        <h2 className="mt-1 font-serif text-2xl text-ink">
          Avez-vous un compte ?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Connectez-vous pour retrouver vos commandes ou continuez sans compte.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {/* Continuer sans compte */}
          <button
            onClick={onContinueAsGuest}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            Continuer sans compte
            <ArrowRight size={15} />
          </button>

          {/* Se connecter / Créer un compte */}
          <button
            onClick={() => setShowLogin((v) => !v)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            <UserRound size={15} />
            Se connecter / Créer un compte
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${showLogin ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Formulaire inline connexion */}
        {showLogin && (
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <AuthTabs callbackUrl="/checkout" onSuccess={onContinueAsGuest} />
          </div>
        )}
      </div>
    </div>
  );
}
