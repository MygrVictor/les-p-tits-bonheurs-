"use client";

// Composant client : `loader` est une fonction, qui ne peut pas être passée
// depuis un Server Component. Les props reçues (src, alt, sizes…) restent
// sérialisables, donc SafeImage s'utilise toujours partout comme avant.
import Image, { type ImageLoader, type ImageProps } from "next/image";

/**
 * Cloudinary sait déjà redimensionner et convertir (AVIF/WebP) à la volée :
 * on lui demande directement la bonne largeur au lieu de faire repasser
 * l'image par l'optimiseur Next/Vercel (double traitement, facturé et plus
 * lent au premier affichage).
 */
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  const parts = url.pathname.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return src;
  const transform = [
    "f_auto",
    quality ? `q_${quality}` : "q_auto",
    "c_limit",
    `w_${width}`,
  ].join(",");
  parts.splice(uploadIndex + 1, 0, transform);
  url.pathname = parts.join("/");
  return url.toString();
};

function isCloudinary(src: ImageProps["src"]): src is string {
  if (typeof src !== "string") return false;
  try {
    return new URL(src).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function optimizeImageSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src !== "string") {
    return src;
  }

  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    return src;
  }

  try {
    const url = new URL(src);

    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("fm", "webp");
      url.searchParams.set("q", url.searchParams.get("q") ?? "80");
      return url.toString();
    }

    return src;
  } catch {
    return src;
  }
}

export function SafeImage(props: ImageProps) {
  if (isCloudinary(props.src)) {
    return <Image {...props} loader={cloudinaryLoader} />;
  }
  return <Image {...props} src={optimizeImageSrc(props.src)} />;
}
