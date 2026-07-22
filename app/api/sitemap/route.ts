import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://lespetitsbonheurs.fr";

function loc(path: string) {
  return `<url><loc>${BASE_URL}${path}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
}

function staticLoc(path: string, changefreq: string, priority: number) {
  return `<url><loc>${BASE_URL}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticLoc("/", "daily", 1.0)}
${staticLoc("/nouveautes", "daily", 0.9)}
${staticLoc("/recherche", "weekly", 0.5)}
${staticLoc("/contact", "monthly", 0.4)}
${staticLoc("/cgv", "yearly", 0.2)}
${staticLoc("/mentions-legales", "yearly", 0.2)}
${staticLoc("/politique-de-confidentialite", "yearly", 0.2)}
${categories.map((c) => staticLoc(`/categorie/${c.slug}`, "weekly", 0.8)).join("\n")}
${products.map((p) => loc(`/produit/${p.slug}`)).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
