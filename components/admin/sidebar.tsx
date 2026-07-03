import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/marques", label: "Marques" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/clients", label: "Clients" },
];

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-neutral-200 bg-white px-6 py-8 lg:block">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          Admin
        </p>
        <h2 className="mt-2 font-serif text-3xl text-ink">
          Les P’tits Bonheurs
        </h2>
      </div>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-blush-50 hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 border-t border-neutral-100 pt-6">
        <Link
          href="/"
          className="block rounded-2xl px-4 py-3 text-sm font-semibold text-primary hover:bg-blush-50"
        >
          ← Retourner sur le site
        </Link>
      </div>
    </aside>
  );
}
