import type { Metadata } from "next";
import { Mail, MapPin, Instagram } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";

export const metadata: Metadata = {
  title: "Contact — Les P'tits Bonheurs",
  description:
    "Une question sur une commande, une envie particulière ? Écrivez-nous, Pauline vous répond personnellement.",
};

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-blush-600">
          ✦ Contact
        </p>
        <h1 className="font-serif text-5xl text-ink">Parlons-en</h1>
        <p className="text-base leading-7 text-neutral-600">
          Une question sur une commande, une envie particulière, une envie de
          collaborer ? Écrivez-nous, Pauline vous répond personnellement.
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-3xl bg-white p-6 shadow-soft">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-100">
              <Mail size={16} className="text-blush-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Par email</p>
              <a
                href="mailto:bonjour@lespetitsbonheurs.fr"
                className="text-sm text-neutral-600 hover:text-primary"
              >
                bonjour@lespetitsbonheurs.fr
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-3xl bg-white p-6 shadow-soft">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-100">
              <MapPin size={16} className="text-blush-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Livraison</p>
              <p className="text-sm text-neutral-600">
                France — expédition en 3 à 5 jours ouvrés
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-3xl bg-white p-6 shadow-soft">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush-100">
              <Instagram size={16} className="text-blush-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">
                Suivez l&apos;atelier
              </p>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-600 hover:text-primary"
              >
                @lespetitsbonheurs
              </a>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
