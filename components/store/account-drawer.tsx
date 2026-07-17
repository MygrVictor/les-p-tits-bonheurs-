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
} from "lucide-react";
import Link from "next/link";
import { AccountProfileForm } from "@/components/store/account-profile-form";

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

interface AccountUser {
  email: string;
  name?: string | null;
  address?: string | null;
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

export function AccountDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);

  useEffect(() => {
    if (!open || !session?.user) return;
    setLoadingOrders(true);
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setUser({
          email: data.user?.email ?? session.user?.email ?? "",
          name: data.user?.name ?? session.user?.name ?? null,
          address: data.user?.address ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [open, session]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl animate-slide-in-right sm:max-w-md">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff5f8]">
              <UserRound size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user?.email || session?.user?.email}
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <AccountProfileForm
              initialName={user?.name ?? session?.user?.name ?? null}
              initialEmail={user?.email ?? session?.user?.email ?? ""}
              initialAddress={user?.address ?? null}
              compact
            />

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  ✦ Commandes
                </p>
                <h2 className="mt-1 font-serif text-2xl text-ink">
                  Mes commandes
                </h2>
              </div>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2
                    size={24}
                    className="animate-spin text-neutral-300"
                  />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-100 py-12 text-center">
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
            </div>
          </div>
        </div>

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
