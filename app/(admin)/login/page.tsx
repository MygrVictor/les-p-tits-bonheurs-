"use client";

import { signIn, signOut } from "next-auth/react";
import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "admin@lespetitsbonheurs.fr";

export default function AdminLoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [router, session?.user?.role]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: ADMIN_EMAIL,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const sessionData = await sessionRes.json();

        if (sessionData?.user?.role !== "ADMIN") {
          await signOut({ redirect: false });
          setError("Ce compte n'a pas les droits administrateur.");
          setLoading(false);
          return;
        }

        router.replace(result.url ?? "/admin");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <h1 className="font-serif text-3xl text-ink">Admin</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Entrez le mot de passe administrateur
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Retourner sur le site
          </Link>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink"
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
