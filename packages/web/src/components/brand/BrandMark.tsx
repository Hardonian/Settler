import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_MARK_PNG } from "./brand-assets";

export type BrandMarkProps = Omit<ImageProps, "src" | "width" | "height" | "alt"> & {
  /** When the mark is adjacent to text that names the product */
  alt?: string;
};

export function BrandMark({ alt = "", className, sizes = "64px", ...rest }: BrandMarkProps) {
  return (
    <Image
      src={BRAND_MARK_PNG.src}
      width={BRAND_MARK_PNG.width}
      height={BRAND_MARK_PNG.height}
      alt={alt}
      className={cn("dark:invert", className)}
      sizes={sizes}
      {...rest}
    />
  );
}
