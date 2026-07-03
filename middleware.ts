import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPaths = ["/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      const loginUrl = new URL("/compte", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
      "connect-src 'self' https://api.stripe.com https://*.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self' https://hooks.stripe.com",
    ].join("; "),
  );

  if (authPaths.some((path) => pathname.startsWith(path))) {
    const attempts = Number(
      request.headers.get("x-ratelimit-remaining") ?? "10",
    );
    if (attempts <= 0) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
