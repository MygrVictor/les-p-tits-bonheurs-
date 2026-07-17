"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    setLoading(true);
    try {
      const response = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Impossible d'envoyer l'email.");
        return;
      }

      setMessage(data.message ?? "Email envoyé si le compte existe.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-soft">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          ✦ Compte client
        </p>
        <h1 className="font-serif text-3xl text-ink">Mot de passe oublié</h1>
        <p className="text-sm text-neutral-500">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="votre@email.fr"
          required
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Envoi en cours…" : "Envoyer le lien"}
        </button>
      </form>

      <Link
        href="/compte?tab=login"
        className="block text-center text-sm text-neutral-500 hover:text-primary"
      >
        Retour à la connexion
      </Link>
    </section>
  );
}
