import Image, { type ImageProps } from "next/image";
import { BRAND_WORDMARK_PNG } from "./brand-assets";

export type BrandWordmarkProps = Omit<ImageProps, "src" | "width" | "height" | "alt"> & {
  alt?: string;
};

export function BrandWordmark({
  alt = "Settler.dev",
  className,
  sizes,
  ...rest
}: BrandWordmarkProps) {
  return (
    <Image
      src={BRAND_WORDMARK_PNG.src}
      width={BRAND_WORDMARK_PNG.width}
      height={BRAND_WORDMARK_PNG.height}
      alt={alt}
      className={className}
      sizes={sizes}
      {...rest}
    />
  );
}
