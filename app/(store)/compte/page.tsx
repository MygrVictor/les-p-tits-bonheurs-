import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthPage } from "@/components/store/auth-page";
import { SignOutButton } from "@/components/store/sign-out-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, UserRound } from "lucide-react";

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
  searchParams?: Promise<{ tab?: string; vue?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const defaultTab = params?.tab === "register" ? "register" : "login";
  const vue = params?.vue === "profil" ? "profil" : "commandes";

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
  const orders = await prisma.order
    .findMany({
      where: { userId: session.user.id as string },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return (
    <section className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ✦ Espace personnel
          </p>
          <h1 className="mt-1 font-serif text-4xl text-ink">Mon compte</h1>
          <p className="mt-1 text-sm text-neutral-500">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Onglets */}
      <div className="flex rounded-2xl bg-neutral-100 p-1 text-sm font-semibold">
        <Link
          href="/compte?vue=commandes"
          className={
            "flex-1 rounded-xl py-2.5 text-center transition " +
            (vue === "commandes"
              ? "bg-white text-ink shadow-sm"
              : "text-neutral-500 hover:text-ink")
          }
        >
          Mes commandes
        </Link>
        <Link
          href="/compte?vue=profil"
          className={
            "flex-1 rounded-xl py-2.5 text-center transition " +
            (vue === "profil"
              ? "bg-white text-ink shadow-sm"
              : "text-neutral-500 hover:text-ink")
          }
        >
          Mon profil
        </Link>
      </div>

      {/* ── Onglet commandes ── */}
      {vue === "commandes" && (
        <div className="space-y-4">
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet profil ── */}
      {vue === "profil" && (
        <div className="max-w-sm space-y-6 rounded-3xl border border-neutral-100 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5f8]">
              <UserRound size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-ink">{session.user.email}</p>
              <p className="text-xs text-neutral-400">Client</p>
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-6">
            <SignOutButton />
          </div>
        </div>
      )}
    </section>
  );
}
