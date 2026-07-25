import Image, { type ImageProps } from "next/image";

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

    if (url.hostname === "res.cloudinary.com") {
      const parts = url.pathname.split("/");
      const uploadIndex = parts.indexOf("upload");

      if (uploadIndex !== -1) {
        parts.splice(uploadIndex + 1, 0, "f_auto,q_auto,w_1200");
        url.pathname = parts.join("/");
      }

      return url.toString();
    }

    return src;
  } catch {
    return src;
  }
}

export function SafeImage(props: ImageProps) {
  return <Image {...props} src={optimizeImageSrc(props.src)} />;
}
