import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFY_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueEmailVerificationToken(
  userId: string,
): Promise<string> {
  const token = generateRawToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000,
  );

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const token = generateRawToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}
