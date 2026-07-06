import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    // Anciens slugs de catégories (avant la réorganisation du menu, 2026)
    // -> nouveaux slugs. Géré ici (couche routing, avant tout rendu) pour
    // garantir un vrai redirect HTTP 308, contrairement à un redirect()
    // appelé depuis un Server Component sous un loading.tsx, qui ne produit
    // qu'un redirect "soft" côté client (invisible pour les crawlers/no-JS).
    const legacyCategoryRedirects = {
      bijoux: "bijouterie",
      "diy-loisirs-creatifs": "jeux-diy",
      "decoration-et-maison": "decoration-maison",
      "mode-et-accessoires": "lifestyle",
      "sac-et-petite-maroquinerie": "lifestyle-maroquinerie",
    };

    return Object.entries(legacyCategoryRedirects).map(
      ([oldSlug, newSlug]) => ({
        source: `/categorie/${oldSlug}`,
        destination: `/categorie/${newSlug}`,
        permanent: true,
      }),
    );
  },
};

export default withAnalyzer(nextConfig);
