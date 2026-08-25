import { cn } from "@/lib/utils";

export type BrandLockupOrientation = "horizontal" | "stacked";

type HorizontalLockupProps = {
  orientation?: "horizontal";
  alt?: string;
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  sizes?: string;
  wordmarkFormat?: "product" | "word";
};

type StackedLockupProps = {
  orientation: "stacked";
  alt?: string;
  className?: string;
  stackedGapClassName?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
  wordmarkFormat?: "product" | "word";
};

export type BrandLockupProps = HorizontalLockupProps | StackedLockupProps;

/**
 * Canonical Settler lockup, rendered as the "SETTLER" wordmark (text-only).
 *
 * Text-only on purpose: no generated-raster dependency, so there is no
 * broken-image or stale-SVG fallback that could surface legacy placeholder
 * text. The `orientation` prop is accepted for API compatibility but both
 * render the same wordmark.
 */
export function BrandLockup(props: BrandLockupProps) {
  const { alt = "Settler", className } = props;
  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        "inline-flex items-center justify-center font-extrabold tracking-tight text-foreground text-2xl leading-none select-none",
        className
      )}
    >
      SETTLER
    </span>
  );
}
