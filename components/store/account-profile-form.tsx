"use client";

import { useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { parseProfileAddress } from "@/lib/address";

type AccountProfileFormProps = {
  initialName?: string | null;
  initialEmail: string;
  initialAddress?: string | null;
  compact?: boolean;
};

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AccountProfileForm({
  initialName,
  initialEmail,
  initialAddress,
  compact = false,
}: Readonly<AccountProfileFormProps>) {
  const initialAddressParts = parseProfileAddress(initialAddress);
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState(initialAddressParts.address);
  const [postalCode, setPostalCode] = useState(initialAddressParts.postalCode);
  const [city, setCity] = useState(initialAddressParts.city);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg("");
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, address, postalCode, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Erreur lors de la mise à jour.");
      } else {
        const savedAddress = parseProfileAddress(data.user?.address ?? "");
        setName(data.user?.name ?? "");
        setEmail(data.user?.email ?? email);
        setAddress(savedAddress.address);
        setPostalCode(data.user?.postalCode ?? savedAddress.postalCode);
        setCity(data.user?.city ?? savedAddress.city);
        setSaveMsg("Informations enregistrées !");
      }
    } catch {
      setSaveError("Erreur serveur. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "space-y-5 rounded-2xl border border-neutral-100 bg-white p-5 shadow-soft"
          : "space-y-6 rounded-3xl border border-neutral-100 bg-white p-8 shadow-soft"
      }
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5f8]">
          <UserRound size={24} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-ink">{email}</p>
          <p className="text-xs text-neutral-400">Client</p>
        </div>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Nom
          </label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Adresse
          </label>
          <textarea
            autoComplete="street-address"
            placeholder="Votre adresse de livraison"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={compact ? 3 : 4}
            className={inputCls + " resize-none"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Code postal
            </label>
            <input
              type="text"
              autoComplete="postal-code"
              placeholder="75001"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ville
            </label>
            <input
              type="text"
              autoComplete="address-level2"
              placeholder="Paris"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {saveError && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {saveError}
          </p>
        )}
        {saveMsg && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          Enregistrer
        </button>
      </form>
    </div>
  );
}
