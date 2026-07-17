"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Tab = "login" | "register";

export function AuthPage({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "login" || tabParam === "register") {
      setTab(tabParam);
    }
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setInfo("");
    setPassword("");
    setConfirm("");
  };

  useEffect(() => {
    const verified = searchParams.get("verified");
    const verificationError = searchParams.get("error");

    if (verified === "1") {
      setInfo("Email confirmé. Vous pouvez vous connecter.");
    } else if (verificationError === "verification") {
      setError("Lien de confirmation invalide ou expiré.");
    }
  }, [searchParams]);

  const redirectByRole = async () => {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;
    window.location.href = role === "ADMIN" ? "/admin" : "/";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Veuillez entrer votre email.");
      return;
    }
    if (!password) {
      setError("Veuillez entrer votre mot de passe.");
      return;
    }
    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Email/mot de passe incorrect ou email non confirmé.");
      } else {
        await redirectByRole();
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Veuillez entrer votre email.");
      return;
    }
    if (!password) {
      setError("Veuillez entrer un mot de passe.");
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
      const reg = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await reg.json();
      if (!reg.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setTab("login");
      setInfo(data.message ?? "Compte créé. Vérifiez votre email.");
    } catch {
      setError("Erreur serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Entrez votre email pour renvoyer le lien de confirmation.");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/account/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de renvoyer l'email.");
        return;
      }
      setInfo(data.message ?? "Email de confirmation renvoyé.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="grid min-h-[72vh] overflow-hidden rounded-3xl border border-neutral-100 shadow-sm lg:grid-cols-2">
      {/* ── GAUCHE : formulaire ── */}
      <div className="flex flex-col justify-center px-8 py-14 sm:px-12">
        {/* Retour boutique */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-ink transition"
        >
          <ArrowLeft size={15} />
          Retour à la boutique
        </Link>

        {/* En-tête */}
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ Les P&apos;tits Bonheurs
          </p>
          <h1 className="font-serif text-4xl text-ink">
            {tab === "login" ? "Bon retour\u00a0!" : "Créer un compte"}
          </h1>
          <p className="text-sm text-neutral-500">
            {tab === "login"
              ? "Connectez-vous pour retrouver vos commandes."
              : "Rejoignez la boutique et suivez vos commandes."}
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex rounded-2xl bg-neutral-100 p-1 text-sm font-semibold">
          <Link
            href="/compte?tab=login"
            className={
              "flex-1 rounded-xl py-2.5 text-center transition " +
              (tab === "login"
                ? "bg-white text-ink shadow-sm"
                : "text-neutral-500 hover:text-ink")
            }
          >
            Se connecter
          </Link>
          <Link
            href="/compte?tab=register"
            className={
              "flex-1 rounded-xl py-2.5 text-center transition " +
              (tab === "register"
                ? "bg-white text-ink shadow-sm"
                : "text-neutral-500 hover:text-ink")
            }
          >
            Créer un compte
          </Link>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {info}
          </div>
        )}

        {/* ── Formulaire connexion ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} noValidate className="space-y-5">
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
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="12 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Se connecter
            </button>

            <div className="flex items-center justify-between gap-3 text-xs">
              <Link
                href="/compte/mot-de-passe-oublie"
                className="font-medium text-neutral-500 hover:text-primary"
              >
                Mot de passe oublié ?
              </Link>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="font-medium text-neutral-500 hover:text-primary disabled:opacity-50"
              >
                Renvoyer l&apos;email de confirmation
              </button>
            </div>

            <p className="text-center text-sm text-neutral-500">
              Pas encore de compte?{" "}
              <Link
                href="/compte?tab=register"
                className="font-semibold text-primary hover:underline"
              >
                Créer un compte →
              </Link>
            </p>
          </form>
        )}

        {/* ── Formulaire inscription ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} noValidate className="space-y-5">
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
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="12 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Répétez le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Créer mon compte
            </button>

            <p className="text-center text-sm text-neutral-500">
              Déjà un compte?{" "}
              <Link
                href="/compte?tab=login"
                className="font-semibold text-primary hover:underline"
              >
                Se connecter →
              </Link>
            </p>
          </form>
        )}
      </div>

      {/* ── DROITE : illustration ── */}
      <div className="relative hidden overflow-hidden bg-[#fff5f8] lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-10 lg:p-12">
        {/* Photo */}
        <div className="relative h-72 w-72 overflow-hidden rounded-[2rem] shadow-md xl:h-80 xl:w-80">
          <Image
            src="/logo.jpg"
            alt="La boutique Les P'tits Bonheurs"
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>

        {/* Texte */}
        <div className="max-w-xs space-y-4 text-center">
          <Sparkles size={20} className="mx-auto text-primary" />
          <p className="font-serif text-2xl leading-snug text-ink">
            Un univers bohème&nbsp;&amp;&nbsp;coloré.
          </p>
          <p className="text-sm leading-7 text-neutral-500">
            Bijoux, mode, déco — chaque pièce est choisie avec soin et passion
            par Pauline.
          </p>
          <blockquote className="rounded-xl border border-primary/20 bg-white/70 px-5 py-4 text-left">
            <p className="text-xs italic text-neutral-400">
              &laquo;&nbsp;C&apos;est véritablement utile puisque c&apos;est
              joli.&nbsp;&raquo;
            </p>
            <footer className="mt-1 text-xs text-neutral-400">
              — Antoine de Saint-Exupéry
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
