import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthPage } from "@/components/store/auth-page";
import { SignOutButton } from "@/components/store/sign-out-button";
import { AccountProfileForm } from "@/components/store/account-profile-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, Truck } from "lucide-react";
import { getCarrier, getTrackingUrl } from "@/lib/carriers";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-neutral-100 text-neutral-500",
};

export default async function ComptePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const defaultTab = params?.tab === "register" ? "register" : "login";

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  /* ── Non connecté ── */
  if (!session?.user) {
    return (
      <section className="py-8">
        <AuthPage defaultTab={defaultTab} />
      </section>
    );
  }

  /* ── Connecté ── */
  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { name: true, email: true, address: true },
    }),
    prisma.order
      .findMany({
        where: { userId: session.user.id as string },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          carrier: true,
          trackingNumber: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
  ]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ Espace personnel
          </p>
          <h1 className="mt-1 font-serif text-4xl text-ink">Mon compte</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {user?.email ?? session.user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <AccountProfileForm
            initialName={user?.name ?? session.user.name ?? null}
            initialEmail={user?.email ?? session.user.email ?? ""}
            initialAddress={user?.address ?? null}
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              ✦ Commandes
            </p>
            <h2 className="mt-1 font-serif text-3xl text-ink">Mes commandes</h2>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-neutral-100 bg-white py-16 text-center shadow-soft">
              <ShoppingBag size={36} className="text-neutral-300" />
              <p className="text-sm text-neutral-500">
                Vous n&apos;avez pas encore de commande.
              </p>
              <Link
                href="/"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package size={18} className="shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Commande #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_COLOR[order.status] ??
                          "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      <p className="text-sm font-bold text-ink">
                        {(order.total / 100).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  {order.items.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-neutral-100 pt-4">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-xs text-neutral-600"
                        >
                          <span>{item.product?.name ?? "Produit"}</span>
                          <span className="text-neutral-400">
                            ×{item.quantity} &nbsp;·&nbsp;{" "}
                            {(item.price / 100).toFixed(2)} €
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {order.trackingNumber && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-blush-50/60 px-4 py-3 text-xs text-neutral-600">
                      <span className="flex items-center gap-2">
                        <Truck size={14} className="shrink-0 text-primary" />
                        {getCarrier(order.carrier)?.label ??
                          "Colis expédié"} — {order.trackingNumber}
                      </span>
                      {getTrackingUrl(order.carrier, order.trackingNumber) && (
                        <a
                          href={
                            getTrackingUrl(order.carrier, order.trackingNumber)!
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          Suivre mon colis →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
