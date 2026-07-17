"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Star, Loader2 } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null } | null;
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`text-xl transition ${
            star <= (hovered || value) ? "text-amber-400" : "text-neutral-300"
          } ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data: { reviews?: Review[] }) => setReviews(data.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (comment.trim().length < 10) {
      setError("Le commentaire doit contenir au moins 10 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de soumettre l'avis.");
        return;
      }
      setMessage(data.message ?? "Avis soumis.");
      setComment("");
      setRating(5);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="space-y-6 rounded-3xl bg-white p-8 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">
          Avis clients
          {reviews.length > 0 && (
            <span className="ml-2 text-base font-normal text-neutral-500">
              ({reviews.length})
            </span>
          )}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(average)} />
            <span className="text-sm font-semibold text-ink">
              {average.toFixed(1)} / 5
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucun avis pour ce produit — soyez le premier !
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-neutral-100 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <StarRating value={review.rating} />
                <span className="text-xs text-neutral-400">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-6 text-neutral-700">
                {review.comment}
              </p>
              {review.user?.name && (
                <p className="mt-2 text-xs text-neutral-400">
                  — {review.user.name}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {session?.user ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border-t border-neutral-100 pt-6"
        >
          <h3 className="font-semibold text-ink">Laisser un avis</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Note
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Commentaire
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Partagez votre expérience avec ce produit…"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
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
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Publier l&apos;avis
          </button>
        </form>
      ) : (
        <p className="border-t border-neutral-100 pt-5 text-sm text-neutral-500">
          <a
            href="/compte?tab=login"
            className="font-semibold text-primary hover:underline"
          >
            Connectez-vous
          </a>{" "}
          pour laisser un avis.
        </p>
      )}
    </section>
  );
}
