"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckoutGate } from "@/components/store/checkout-gate";
import { ShoppingBag, MapPin, CreditCard, Loader2 } from "lucide-react";
import {
  useCartStore,
  selectCartCount,
  selectCartTotal,
} from "@/lib/cart-store";

type ShippingForm = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
};

type RelayPoint = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: "FR";
};

function splitFullName(value: string): { firstName: string; lastName: string } {
  const trimmed = value.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function CheckoutForm({ isGuest }: Readonly<{ isGuest: boolean }>) {
  const { data: session } = useSession();
  const items = useCartStore((s) => s.items);
  const cartTotal = useCartStore(selectCartTotal);
  const itemCount = useCartStore(selectCartCount);

  const [form, setForm] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    country: "FR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [selectedRelayId, setSelectedRelayId] = useState("");
  const [relaySource, setRelaySource] = useState<"provider" | "mock" | null>(
    null,
  );
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayError, setRelayError] = useState("");
  const accountPrefilledRef = useRef(false);

  useEffect(() => {
    if (session?.user?.email) {
      setForm((f) => ({ ...f, email: session.user!.email ?? f.email }));
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email || accountPrefilledRef.current) return;

    let cancelled = false;

    const loadAccount = async () => {
      try {
        const response = await fetch("/api/account");
        if (!response.ok) return;

        const data = await response.json();
        const user = data?.user;
        if (cancelled || !user) return;

        const fullName = String(user.name ?? session.user?.name ?? "");
        const nameParts = splitFullName(fullName);

        setForm((current) => ({
          ...current,
          firstName: current.firstName || nameParts.firstName,
          lastName: current.lastName || nameParts.lastName,
          email: current.email || user.email || session.user?.email || "",
          address: current.address || user.address || "",
          postalCode: current.postalCode || user.postalCode || "",
          city: current.city || user.city || "",
        }));
        accountPrefilledRef.current = true;
      } catch {
        /* no-op */
      }
    };

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, session?.user?.name]);

  const update =
    (field: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const selectedRelay = relayPoints.find(
      (point) => point.id === selectedRelayId,
    );

    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.address ||
      !form.postalCode ||
      !form.city ||
      !form.country
    ) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    if (!selectedRelay) {
      setError("Merci de sélectionner un point relais Mondial Relay.");
      return;
    }

    if (items.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
          shippingCountry: form.country,
          relayPoint: {
            id: selectedRelay.id,
            name: selectedRelay.name,
            address: selectedRelay.address,
            postalCode: selectedRelay.postalCode,
            city: selectedRelay.city,
            country: selectedRelay.country,
          },
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue. Réessayez.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setLoading(false);
    }
  };

  const canSearchRelay =
    form.postalCode.trim().length >= 4 && form.city.trim().length >= 2;

  const handleLoadRelayPoints = async () => {
    if (!canSearchRelay) {
      setRelayError("Renseigne un code postal et une ville valides.");
      return;
    }

    setRelayLoading(true);
    setRelayError("");
    setSelectedRelayId("");

    try {
      const params = new URLSearchParams({
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        country: "FR",
      });
      const response = await fetch(
        `/api/mondial-relay/points?${params.toString()}`,
      );
      const data = (await response.json()) as {
        points?: RelayPoint[];
        source?: "provider" | "mock";
        error?: string;
      };

      if (!response.ok) {
        setRelayError(data.error ?? "Impossible de charger les points relais.");
        setRelayPoints([]);
        setRelaySource(null);
        return;
      }

      const points = Array.isArray(data.points) ? data.points : [];
      setRelayPoints(points);
      setRelaySource(data.source ?? null);

      if (points.length === 0) {
        setRelayError("Aucun point relais trouvé pour cette recherche.");
      }
    } catch {
      setRelayError("Impossible de charger les points relais.");
      setRelayPoints([]);
      setRelaySource(null);
    } finally {
      setRelayLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isGuest && (
        <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          Vous commandez en tant qu&apos;invité. Créez un compte après votre
          commande pour suivre vos livraisons.
        </p>
      )}

      {/* Récapitulatif */}
      <section className="space-y-3 rounded-2xl border border-neutral-100 bg-blush-50/60 p-4">
        <p className="text-sm font-semibold text-ink">
          {itemCount} article{itemCount > 1 ? "s" : ""} — {cartTotal.toFixed(2)}{" "}
          €
        </p>
        <ul className="space-y-1 text-xs text-neutral-600">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <span>
                {item.productName}
                {item.variantLabel ? ` · ${item.variantLabel}` : ""} ×
                {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Coordonnées */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          <h2 className="font-serif text-xl text-ink">Livraison</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Prénom
            </label>
            <input
              type="text"
              required
              value={form.firstName}
              onChange={update("firstName")}
              placeholder="Prénom"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Nom
            </label>
            <input
              type="text"
              required
              value={form.lastName}
              onChange={update("lastName")}
              placeholder="Nom"
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="votre@email.fr"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Adresse
          </label>
          <input
            type="text"
            required
            value={form.address}
            onChange={update("address")}
            placeholder="12 rue des Lilas"
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Code postal
            </label>
            <input
              type="text"
              required
              value={form.postalCode}
              onChange={(event) => {
                setForm((f) => ({ ...f, postalCode: event.target.value }));
                setRelayPoints([]);
                setSelectedRelayId("");
                setRelayError("");
                setRelaySource(null);
              }}
              placeholder="75001"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ville
            </label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(event) => {
                setForm((f) => ({ ...f, city: event.target.value }));
                setRelayPoints([]);
                setSelectedRelayId("");
                setRelayError("");
                setRelaySource(null);
              }}
              placeholder="Paris"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Point relais Mondial Relay
            </p>
            <button
              type="button"
              onClick={handleLoadRelayPoints}
              disabled={relayLoading || !canSearchRelay}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
            >
              {relayLoading ? "Recherche..." : "Rechercher des relais"}
            </button>
          </div>

          {relaySource === "mock" && (
            <p className="text-xs text-amber-700">
              Mode attente API : résultats de démonstration.
            </p>
          )}

          {relayError && <p className="text-xs text-rose-600">{relayError}</p>}

          {relayPoints.length > 0 && (
            <div className="space-y-2">
              {relayPoints.map((point) => (
                <label
                  key={point.id}
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="relayPoint"
                    value={point.id}
                    checked={selectedRelayId === point.id}
                    onChange={() => setSelectedRelayId(point.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-ink">
                      {point.name}
                    </span>
                    <span className="block text-neutral-600">
                      {point.address}, {point.postalCode} {point.city}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Zone de livraison
          </label>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            France — livraison via Mondial Relay uniquement
          </div>
        </div>
      </section>

      {/* Paiement */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-primary" />
          <h2 className="font-serif text-xl text-ink">Paiement</h2>
        </div>
        <div className="rounded-3xl border border-neutral-100 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Vous allez être redirigé vers Stripe Checkout (mode test).
          <br />
          Carte de test : 4242 4242 4242 4242 — date future — CVC 123.
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingBag size={16} />
        )}
        {loading ? "Redirection vers Stripe…" : "Confirmer la commande"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);
  const items = useCartStore((s) => s.items);
  const cartTotal = useCartStore(selectCartTotal);

  const isLoggedIn = status === "authenticated" && Boolean(session?.user);

  if (status !== "loading" && items.length === 0) {
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="font-serif text-4xl text-ink">Finaliser mon achat</h1>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 shadow-soft">
          <ShoppingBag size={40} className="text-neutral-200" />
          <p className="text-sm text-neutral-500">Votre panier est vide.</p>
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Découvrir la boutique
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ Commande
        </p>
        <h1 className="mt-1 font-serif text-4xl text-ink">
          Finaliser mon achat
        </h1>
        {items.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            Total {cartTotal.toFixed(2)} €
          </p>
        )}
      </div>

      {!ready && !isLoggedIn ? (
        <CheckoutGate onContinueAsGuest={() => setReady(true)} />
      ) : (
        <CheckoutForm isGuest={!isLoggedIn} />
      )}
    </section>
  );
}
