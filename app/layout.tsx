import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Playfair_Display } from "next/font/google";
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

// Auto-hébergées et préchargées par Next (plus d'@import Google Fonts
// bloquant dans globals.css). Mêmes familles et graisses qu'avant.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${playfair.variable} ${inter.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
