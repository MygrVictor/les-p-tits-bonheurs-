"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCartStore, selectCartCount } from "@/lib/cart-store";

const navItems = [
  { href: "/", icon: Home, label: "Accueil", badge: false },
  {
    href: "/categorie/bijouterie",
    icon: LayoutGrid,
    label: "Boutique",
    badge: false,
  },
  { href: "/recherche", icon: Search, label: "Recherche", badge: false },
  { href: "/panier", icon: ShoppingBag, label: "Panier", badge: true },
  { href: "/compte", icon: UserRound, label: "Compte", badge: false },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const count = useCartStore(selectCartCount);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 bg-white/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const showBadge = item.badge && count > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors ${isActive ? "text-primary" : "text-neutral-400"}`}
            >
              <item.icon size={21} strokeWidth={isActive ? 2.5 : 1.75} />
              {showBadge && (
                <span className="absolute right-[calc(50%-15px)] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <span
                className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-normal"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
