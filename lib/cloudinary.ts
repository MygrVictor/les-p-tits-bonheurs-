import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

let isConfigured = false;

export function getCloudinaryClient() {
  if (!isConfigured) {
    const env = getEnv();
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isConfigured = true;
  }

  return cloudinary;
}
