import { cn } from "@/lib/utils";

export type BrandWordmarkProps = {
  alt?: string;
  className?: string;
  /** Word-only (stacked auth) vs product URL */
  format?: "product" | "word";
};

/**
 * Text wordmark — avoids shipping a wrong raster wordmark; pairs with `BrandMark`.
 */
export function BrandWordmark({
  alt = "Settler.dev",
  className,
  format = "product",
}: BrandWordmarkProps) {
  const text = format === "word" ? "Settler" : "Settler.dev";
  return (
    <span
      title={alt}
      className={cn(
        "inline-block font-sans font-semibold tracking-tight text-foreground antialiased select-none",
        format === "product"
          ? "text-[clamp(1.125rem,5vw,1.75rem)] leading-none"
          : "text-[clamp(1.25rem,6vw,2rem)] leading-none",
        className
      )}
    >
      {text}
    </span>
  );
}
