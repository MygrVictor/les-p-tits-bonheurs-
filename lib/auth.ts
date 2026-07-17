import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        if (user.deletedAt) {
          console.warn(`[auth] compte supprimé/anonymisé: ${normalizedEmail}`);
          return null;
        }

        if (!user.emailVerifiedAt) {
          console.warn(`[auth] email non vérifié: ${normalizedEmail}`);
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
});

export function getBootstrapAdminEmail(): string {
  return getEnv().ADMIN_BOOTSTRAP_EMAIL;
}
