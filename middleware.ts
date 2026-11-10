import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import { rateLimit } from "@/lib/rate-limit";
import { authConfig } from "@/lib/auth.config";

// Routes soumises au rate limiting (hits par IP, fenêtre glissante 60 s)
const RATE_LIMIT_RULES: { prefix: string; limit: number }[] = [
  { prefix: "/api/auth", limit: 30 },
  { prefix: "/api/account", limit: 30 },
  { prefix: "/api/account/forgot-password", limit: 5 },
  { prefix: "/api/account/reset-password", limit: 5 },
  { prefix: "/api/account/register", limit: 10 },
  { prefix: "/api/account/resend-verification", limit: 5 },
  { prefix: "/api/checkout", limit: 30 },
  { prefix: "/api/contact", limit: 10 },
  { prefix: "/api/reviews", limit: 20 },
  { prefix: "/api/wishlist", limit: 20 },
];

const { auth } = NextAuth(authConfig);

function scriptSrcDirective(): string {
  const base = [
    "'self'",
    "'unsafe-inline'",
    "https://js.stripe.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ];
  if (process.env.NODE_ENV !== "production") base.splice(2, 0, "'unsafe-eval'");
  return `script-src ${base.join(" ")}`;
}

export default auth(async function middleware(request: NextAuthRequest) {
  const { pathname } = request.nextUrl;
  const role = request.auth?.user?.role;

  // Connexion unique et simple : un seul point d'entrée (/compte) pour tout
  // le monde, client comme admin. Les anciennes routes de connexion séparées
  // redirigent toutes vers ce même formulaire — une seule connexion suffit.
  if (
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/admin.html"
  ) {
    return NextResponse.redirect(new URL("/compte", request.url));
  }

  // Protège tout le back-office : redirige vers /compte si le visiteur n'a
  // pas de session valide avec le rôle ADMIN. Fait ici (middleware) plutôt
  // que dans le layout car redirect() dans un layout ne bloque pas
  // fiablement les navigations directes/rechargements de page.
  //
  // On utilise `auth()` (et non `getToken` de next-auth/jwt) car lui seul
  // lit la session normalisée par NextAuth, y compris le rôle injecté dans le
  // token/session. Cela évite les écarts entre le middleware et les routes
  // protégées qui s'appuient sur les callbacks JWT/session.
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      const loginUrl = new URL("/compte", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrcDirective(),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.google-analytics.com",
      "connect-src 'self' https://api.stripe.com https://*.stripe.com https://www.google-analytics.com https://analytics.google.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self' https://hooks.stripe.com",
    ].join("; "),
  );

  // Rate limiting réel : fenêtre glissante 60 s, par IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rule = RATE_LIMIT_RULES.find((r) => pathname.startsWith(r.prefix));
  if (rule) {
    const result = rateLimit(`${rule.prefix}:${ip}`, rule.limit, 60_000);
    if (!result.ok) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        },
      });
    }
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/account") ||
    pathname.startsWith("/api/reviews") ||
    pathname.startsWith("/api/wishlist") ||
    pathname.startsWith("/api/checkout")
  ) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
});

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
