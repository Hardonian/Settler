import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_WORDMARK_PNG } from "./brand-assets";

export type BrandWordmarkProps = Omit<ImageProps, "src" | "width" | "height" | "alt"> & {
  alt?: string;
  theme?: "auto" | "light" | "dark";
};

export function BrandWordmark({
  alt = "Settler.dev",
  className,
  sizes,
  theme = "auto",
  ...rest
}: BrandWordmarkProps) {
  const themeClass = theme === "dark" ? "invert" : theme === "auto" ? "dark:invert" : "";

  return (
    <Image
      src={BRAND_WORDMARK_PNG.src}
      width={BRAND_WORDMARK_PNG.width}
      height={BRAND_WORDMARK_PNG.height}
      alt={alt}
      className={cn(themeClass, className)}
      sizes={sizes}
      {...rest}
    />
  );
}
