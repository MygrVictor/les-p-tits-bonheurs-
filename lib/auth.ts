import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { loginSchema } from "@/lib/validations/auth";

const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 30,
  },
  trustHost: true,
  pages: {
    signIn: "/compte",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.warn("[auth] payload de connexion invalide");
          return null;
        }

        const normalizedEmail = parsed.data.email.toLowerCase().trim();

        const user = (await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })) as any;

        if (!user) {
          console.warn(
            `[auth] aucun utilisateur trouvé pour l'email: ${normalizedEmail}`,
          );
          return null;
        }

        const matches = await compare(parsed.data.password, user.password);
        if (!matches) {
          console.warn(
            `[auth] mot de passe incorrect pour l'email: ${normalizedEmail}`,
          );
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name || undefined,
        };
      },
    }),
  ],
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

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export function getBootstrapAdminEmail(): string {
  return getEnv().ADMIN_BOOTSTRAP_EMAIL;
}
