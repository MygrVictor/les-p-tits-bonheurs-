import Link from "next/link";
import { Instagram, Mail, MapPin } from "lucide-react";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Notre histoire", href: "/a-propos" },
  { label: "Bijoux", href: "/categorie/bijoux" },
  { label: "Mode et Accessoires", href: "/categorie/lifestyle" },
  { label: "Décoration", href: "/categorie/decoration-et-maison" },
  { label: "Papeterie", href: "/categorie/papeterie" },
  { label: "Sacs", href: "/categorie/lifestyle" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGV", href: "/cgv" },
  {
    label: "Politique de confidentialité",
    href: "/politique-de-confidentialite",
  },
];

export function StoreFooter() {
  return (
    <footer className="mt-20 border-t border-neutral-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <p className="font-serif text-2xl text-ink">
              Les P&apos;tits Bonheurs
            </p>
            <p className="max-w-sm text-sm leading-7 text-neutral-600">
              Un univers bohème, coloré et empreint de poésie. Chaque création
              et chaque découverte sont choisies avec passion par Pauline.
            </p>
            <blockquote className="border-l-2 border-blush-300 pl-4">
              <p className="text-sm italic leading-6 text-neutral-500">
                « C&apos;est véritablement utile puisque c&apos;est joli. »
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                — Antoine de Saint-Exupéry
              </p>
            </blockquote>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-100 text-blush-700 hover:bg-blush-200 transition"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="mailto:bonjour@lespetitsbonheurs.fr"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-100 text-blush-700 hover:bg-blush-200 transition"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Boutique
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 hover:text-ink transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info + legal */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Informations
              </p>
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <MapPin size={14} className="mt-0.5 shrink-0 text-blush-400" />
                <span>France — Livraison en 3 à 5 jours ouvrés</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-neutral-600">
                <Mail size={14} className="mt-0.5 shrink-0 text-blush-400" />
                <a
                  href="mailto:bonjour@lespetitsbonheurs.fr"
                  className="hover:text-ink transition"
                >
                  bonjour@lespetitsbonheurs.fr
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Légal
              </p>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-neutral-500 hover:text-ink transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-100 pt-6 flex flex-col items-center justify-between gap-3 text-xs text-neutral-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Les P&apos;tits Bonheurs — Pauline.
            Tous droits réservés.
          </p>
          <div className="flex gap-4">
            {legalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-ink transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
