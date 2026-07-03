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
          return null;
        }

        const user = (await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })) as any;

        if (!user) {
          return null;
        }

        const matches = await compare(parsed.data.password, user.password);
        if (!matches) {
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
