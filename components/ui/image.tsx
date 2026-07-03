import Image, { type ImageProps } from "next/image";

export function SafeImage(props: ImageProps) {
  return <Image {...props} />;
}
