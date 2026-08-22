import { cn } from "@/lib/utils";

export type SettlerLogoVariant = "horizontal" | "icon" | "wordmark" | "stacked" | "square";

export type SettlerLogoProps = {
  variant?: SettlerLogoVariant;
  /** Reserved for future theme-specific assets; text adapts via CSS variables. */
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Canonical Settler brand mark.
 *
 * Rendered as the "SETTLER" wordmark (text-only) on purpose: no image asset
 * dependency means there is no broken-image or stale-SVG fallback that could
 * surface legacy placeholder text. Styling adapts to light/dark via
 * `text-foreground`; callers may size it with `className`.
 */
export function SettlerLogo({ className, alt = "Settler" }: SettlerLogoProps) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        "inline-flex items-center font-extrabold tracking-tight text-foreground text-xl leading-none select-none",
        className
      )}
    >
      SETTLER
    </span>
  );
}
