import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://lespetitsbonheurs.fr"),
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
