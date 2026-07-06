import type { NextAuthConfig } from "next-auth";

/**
 * Configuration NextAuth « sûre pour l'Edge Runtime ».
 *
 * Elle ne contient aucune dépendance Node.js (Prisma, bcryptjs…) et peut donc
 * être importée dans middleware.ts, qui s'exécute sur l'Edge Runtime de
 * Vercel. Le fournisseur Credentials (qui a besoin de Prisma/bcrypt) n'est
 * ajouté que dans lib/auth.ts, utilisé côté Node (Route Handlers, Server
 * Components).
 *
 * Les callbacks jwt/session doivent rester ici aussi : c'est ce qui permet au
 * middleware de lire correctement `session.user.role` à partir du token.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 30,
  },
  trustHost: true,
  pages: {
    signIn: "/compte",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role =
          "role" in user && user.role === "ADMIN" ? "ADMIN" : "CLIENT";
        if ("name" in user) token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "CLIENT";
        if (token.sub) session.user.id = token.sub;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
