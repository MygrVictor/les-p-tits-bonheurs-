import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        404
      </p>
      <h1 className="font-serif text-4xl text-ink">Page introuvable</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
