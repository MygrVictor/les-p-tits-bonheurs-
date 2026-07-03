"use server";

import { signIn } from "@/lib/auth";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";

/**
 * Connexion via credentials.
 * Succès → retourne { ok: true } — le client fait la navigation.
 * Échec  → retourne { error }.
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirectTo: "/compte",
    });
  } catch (err: unknown) {
    // NextAuth lance NEXT_REDIRECT en cas de succès — on l'intercepte
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      return { ok: true };
    }
    if (err instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    return { error: "Erreur de connexion. Réessayez." };
  }
  return { ok: true };
}

/**
 * Création de compte puis connexion automatique.
 * Succès → retourne { ok: true }.
 * Échec  → retourne { error }.
 */
export async function registerAction(
  email: string,
  password: string,
): Promise<{ error?: string; ok?: boolean }> {
  const em = email.toLowerCase().trim();

  if (!em || !password || password.length < 12) {
    return { error: "Le mot de passe doit contenir au moins 12 caractères." };
  }

  const existing = await prisma.user.findUnique({ where: { email: em } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const hashed = await hash(password, 12);
  await prisma.user.create({ data: { email: em, password: hashed } });

  try {
    await signIn("credentials", {
      email: em,
      password,
      redirectTo: "/compte",
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      return { ok: true };
    }
    if (err instanceof AuthError) {
      return { error: "Compte créé ! Connectez-vous avec vos identifiants." };
    }
    return { error: "Erreur serveur. Réessayez." };
  }
  return { ok: true };
}
