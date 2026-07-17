import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailVerificationToken } from "@/lib/auth-tokens";
import { sendEmailVerification } from "@/lib/auth-notifications";

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides." },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 },
      );
    }

    const hashed = await hash(password, 12);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed },
    });

    const token = await issueEmailVerificationToken(user.id);
    await sendEmailVerification({ email: user.email, token });

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé. Vérifiez votre email pour activer votre compte.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
