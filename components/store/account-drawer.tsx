"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  X,
  Package,
  UserRound,
  ShoppingBag,
  LogOut,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";

type AccountTab = "commandes" | "infos";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: { name: string } | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

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

const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AccountDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<AccountTab>("commandes");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Infos form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  // Pré-remplir avec les données serveur à l'ouverture
  useEffect(() => {
    if (!open || !session?.user) return;
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setEmail(data.user?.email ?? session.user?.email ?? "");
        setName(data.user?.name ?? "");
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
    setLoadingOrders(true);
  }, [open, session]);

  // Fermer avec Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg("");
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Erreur lors de la mise à jour.");
      } else {
        setSaveMsg("Informations enregistrées !");
      }
    } catch {
      setSaveError("Erreur serveur. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl animate-slide-in-right sm:max-w-md">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff5f8]">
              <UserRound size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {email || session?.user?.email}
              </p>
              <p className="text-xs text-neutral-400">Espace personnel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 rounded-full p-1.5 transition hover:bg-neutral-100"
            aria-label="Fermer"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex gap-6 border-b border-neutral-100 px-6">
          {(
            [
              { key: "commandes", label: "Mes commandes" },
              { key: "infos", label: "Mes informations" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "py-3 text-sm font-semibold transition border-b-2 " +
                (tab === key
                  ? "border-primary text-ink"
                  : "border-transparent text-neutral-400 hover:text-ink")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ── Commandes ── */}
          {tab === "commandes" && (
            <>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2
                    size={24}
                    className="animate-spin text-neutral-300"
                  />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <ShoppingBag size={36} className="text-neutral-200" />
                  <p className="text-sm text-neutral-400">
                    Aucune commande pour l&apos;instant.
                  </p>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Découvrir la boutique
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-neutral-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Package
                            size={14}
                            className="shrink-0 text-primary"
                          />
                          <p className="text-sm font-semibold text-ink">
                            #{order.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
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
                      <p className="mt-1 text-xs text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {order.items.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-neutral-50 pt-3">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-xs text-neutral-500"
                            >
                              <span>{item.product?.name ?? "Produit"}</span>
                              <span>
                                ×{item.quantity} ·{" "}
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
            </>
          )}

          {/* ── Informations ── */}
          {tab === "infos" && (
            <form onSubmit={handleSave} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Nom
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>

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
                  className={inputCls}
                />
              </div>

              {saveError && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {saveError}
                </p>
              )}
              {saveMsg && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Enregistrer
              </button>
            </form>
          )}
        </div>

        {/* Pied : déconnexion */}
        <div className="border-t border-neutral-100 px-6 py-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-neutral-500 transition hover:text-rose-600"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
