import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://lespetitsbonheurs.fr";

export function GET() {
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /compte

Sitemap: ${BASE_URL}/api/sitemap`;

  return new NextResponse(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
