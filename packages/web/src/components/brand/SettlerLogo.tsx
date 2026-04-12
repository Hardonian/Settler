import { BrandLockup } from "./BrandLockup";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";

export type SettlerLogoVariant = "horizontal" | "icon" | "wordmark" | "stacked" | "square";

export type SettlerLogoProps = {
  variant?: SettlerLogoVariant;
  /** Reserved for future theme-specific assets; lockup reads well on light and dark UI. */
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  alt?: string;
};

/** Compatibility alias for the canonical `BrandLogo` / `BrandLockup` components. */
export function SettlerLogo({
  variant = "horizontal",
  theme = "auto",
  className,
  priority = false,
  alt = "Settler.dev",
}: SettlerLogoProps) {
  if (variant === "icon" || variant === "square") {
    return <BrandMark alt="" className={className} priority={priority} />;
  }
  if (variant === "wordmark") {
    return <BrandWordmark alt={alt} theme={theme} className={className} priority={priority} />;
  }
  if (variant === "stacked") {
    return (
      <BrandLockup orientation="stacked" alt={alt} className={className} priority={priority} />
    );
  }
  return <BrandLockup alt={alt} theme={theme} className={className} priority={priority} />;
}
