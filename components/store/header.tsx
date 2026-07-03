"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu,
  ShoppingBag,
  UserRound,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { useCartStore, selectCartCount } from "@/lib/cart-store";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AccountDrawer } from "@/components/store/account-drawer";
import { storefrontMainMenu } from "@/lib/menu";

export function StoreHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const count = useCartStore(selectCartCount);
  const { data: session } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        router.push(`/recherche?q=${encodeURIComponent(value.trim())}`);
      }
    }, 350);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Hamburger — mobile uniquement */}
          <button
            className="rounded-full bg-white/25 p-2.5 text-white shadow-sm hover:bg-white/35 transition lg:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Barre de recherche — gauche, desktop */}
          <div className="hidden lg:block lg:w-64 xl:w-80">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                aria-label="Rechercher"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-full border border-white/60 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-white/80"
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logo texte — droite, desktop */}
          <Link
            href="/"
            className="hidden shrink-0 font-serif text-lg text-white lg:block xl:text-xl"
          >
            Les P&apos;tits Bonheurs
          </Link>

          {/* Panier + compte */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full bg-white/25 p-2.5 text-white shadow-sm hover:bg-white/35 transition"
              aria-label="Panier"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            {session?.user ? (
              <button
                onClick={() => {
                  if (isAdmin) {
                    router.push("/admin");
                    return;
                  }
                  setAccountOpen(true);
                }}
                className="rounded-full bg-white/25 px-4 py-2.5 text-white shadow-sm hover:bg-white/35 transition text-sm font-semibold"
                aria-label={isAdmin ? "Tableau de bord admin" : "Mon compte"}
              >
                {session.user.name || session.user.email?.split("@")[0]}
              </button>
            ) : (
              <Link
                href="/compte"
                className="rounded-full bg-white/25 p-2.5 text-white shadow-sm hover:bg-white/35 transition"
                aria-label="Mon compte"
              >
                <UserRound size={20} />
              </Link>
            )}
          </div>
        </div>

        {/* Barre de recherche — mobile, sous les icônes */}
        <div className="px-4 pb-3 lg:hidden">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              aria-label="Rechercher"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-full border border-white/60 bg-white py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative flex w-80 max-w-[85vw] flex-col bg-white p-6 shadow-xl overflow-y-auto sm:w-96">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-serif text-xl text-ink">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <X size={22} className="text-ink" />
              </button>
            </div>
            <div className="flex-1 space-y-1">
              {storefrontMainMenu.map((item) => {
                const hasChildren = Boolean(item.sections?.length);
                const isExpanded = expandedCat === item.label;

                return (
                  <div key={item.label} className="overflow-hidden rounded-2xl">
                    {/* Category row */}
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-ink"
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() =>
                            setExpandedCat(isExpanded ? null : item.label)
                          }
                          className="flex h-10 w-10 items-center justify-center text-neutral-400"
                          aria-label={isExpanded ? "Réduire" : "Développer"}
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Expanded panel */}
                    {isExpanded && hasChildren && (
                      <div className="border-t border-neutral-50 bg-blush-50/60 px-3 pb-3 pt-2">
                        <div className="space-y-3">
                          {item.sections?.map((section) => (
                            <div key={`${item.label}-${section.title}`}>
                              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                                {section.title}
                              </p>
                              <div className="space-y-0.5">
                                {section.links.map((link, index) => (
                                  <Link
                                    key={`${item.label}-${section.title}-${link.label}-${index}`}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 active:bg-blush-100"
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blush-200 text-[10px] font-bold text-blush-700">
                                      {link.label.charAt(0)}
                                    </span>
                                    {link.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="mt-2 block rounded-xl px-3 py-2 text-xs font-semibold text-blush-600 active:bg-blush-100"
                        >
                          Voir tout → {item.label}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-neutral-100 pt-4 space-y-2">
              <Link
                href="/a-propos"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-ink hover:bg-blush-50"
              >
                Notre histoire
              </Link>
              <Link
                href="/compte"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-ink hover:bg-blush-50"
              >
                <UserRound size={16} /> Mon compte
              </Link>
              <Link
                href="/panier"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-ink hover:bg-blush-50"
              >
                <ShoppingBag size={16} /> Panier
              </Link>
            </div>
          </nav>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
