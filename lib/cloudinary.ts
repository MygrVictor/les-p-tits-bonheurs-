import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

/**
 * Valide et lit uniquement les 3 variables Cloudinary, indépendamment du
 * reste de la configuration (Stripe, Resend, etc. via lib/env.ts).
 *
 * Important : ne PAS passer par `getEnv()` ici. Cette dernière valide
 * TOUTES les variables d'environnement d'un coup — si une seule autre
 * variable (ex. STRIPE_PUBLISHABLE_KEY) est mal formée sur la plateforme
 * de déploiement, `getEnv()` lève une erreur et casse l'upload d'image,
 * alors même que les identifiants Cloudinary sont parfaitement valides.
 * C'est exactement ce qui s'est produit en production.
 */
function readCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Configuration Cloudinary manquante : ${missing.join(", ")}`,
    );
  }

  return {
    cloudName: cloudName!,
    apiKey: apiKey!,
    apiSecret: apiSecret!,
  };
}

export function getCloudinaryClient() {
  if (!isConfigured) {
    const env = readCloudinaryEnv();
    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}
