"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        Oups
      </p>
      <h1 className="font-serif text-4xl text-ink">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir à
        l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
