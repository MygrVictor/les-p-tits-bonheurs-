"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Tab = "login" | "register";

export function AuthTabs({
  callbackUrl = "/compte",
  onSuccess,
}: {
  callbackUrl?: string;
  onSuccess?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const reset = () => {
    setError("");
    setSuccess("");
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
  };

  const redirectByRole = async () => {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;
    const target = role === "ADMIN" ? "/admin" : callbackUrl;
    router.push(target);
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Email ou mot de passe incorrect.");
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          await redirectByRole();
        }
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email || !password || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      // Auto-connexion après inscription
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!login || login.error) {
        setSuccess("Compte créé ! Connectez-vous ci-dessous.");
        setPassword("");
        setConfirm("");
        setTab("login");
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          await redirectByRole();
        }
      }
    } catch {
      setError("Erreur serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex rounded-2xl bg-neutral-100 p-1">
        {(["login", "register"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === t
                ? "bg-white text-ink shadow-sm"
                : "text-neutral-500 hover:text-ink"
            }`}
          >
            {t === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>

      <form
        onSubmit={tab === "login" ? handleLogin : handleRegister}
        className="space-y-4"
      >
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            className={inputClass}
          />
        </div>

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              autoComplete={
                tab === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="12 caractères minimum"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirmer (inscription) */}
        {tab === "register" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Confirmer le mot de passe
            </label>
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {tab === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
