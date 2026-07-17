import { prisma } from "@/lib/prisma";
import { approveReview, deleteReview } from "@/app/(admin)/admin/actions";
import { CheckCircle2, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <section className="space-y-8">
      <h1 className="font-serif text-4xl text-ink">
        Avis clients
        {pending.length > 0 && (
          <span className="ml-3 inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
            {pending.length} en attente
          </span>
        )}
      </h1>

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            En attente de modération
          </h2>
          {pending.map((review) => (
            <ReviewCard key={review.id} review={review} pending />
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Publiés
          </h2>
          {approved.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <p className="text-sm text-neutral-500">Aucun avis pour le moment.</p>
      )}
    </section>
  );
}

function ReviewCard({
  review,
  pending = false,
}: {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    approved: boolean;
    product: { name: string; slug: string };
    user: { email: string; name: string | null } | null;
  };
  pending?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {review.product.name}
          </p>
          <p className="text-xs text-neutral-400">
            {review.user?.name ?? review.user?.email ?? "Anonyme"} —{" "}
            {new Date(review.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          {"★".repeat(review.rating)}
          <span className="text-neutral-300">
            {"★".repeat(5 - review.rating)}
          </span>
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-neutral-700">
        {review.comment}
      </p>
      <div className="flex gap-2">
        {pending && (
          <form action={approveReview.bind(null, review.id)}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
            >
              <CheckCircle2 size={14} /> Approuver
            </button>
          </form>
        )}
        <form action={deleteReview.bind(null, review.id)}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </form>
      </div>
    </div>
  );
}
