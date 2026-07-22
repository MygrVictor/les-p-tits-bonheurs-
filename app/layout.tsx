import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const FALLBACK_BASE_URL = "https://lespetitsbonheurs.fr";

function resolveBaseUrl() {
  const candidate = process.env.NEXTAUTH_URL?.trim();

  if (!candidate) {
    return FALLBACK_BASE_URL;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return FALLBACK_BASE_URL;
  }
}

const BASE_URL = resolveBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Les P'tits Bonheurs — Bijoux & Accessoires Artisanaux",
    template: "%s — Les P'tits Bonheurs",
  },
  description:
    "Boutique en ligne de bijoux, mode et accessoires artisanaux. Sélection bohème et colorée, livrée en France et en Europe.",
  openGraph: {
    siteName: "Les P'tits Bonheurs",
    locale: "fr_FR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
