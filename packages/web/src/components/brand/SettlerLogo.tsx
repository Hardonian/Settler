import Image from "next/image";
import { cn } from "@/lib/utils";

type SettlerLogoVariant = "horizontal" | "icon" | "wordmark";

interface SettlerLogoProps {
  variant?: SettlerLogoVariant;
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  alt?: string;
}

const LOGO_CONFIG = {
  horizontal: {
    light: "/brand/settler/logo-horizontal.svg",
    dark: "/brand/settler/logo-horizontal-dark.svg",
    width: 130,
    height: 34,
  },
  icon: {
    light: "/brand/settler/logo-icon.svg",
    dark: "/brand/settler/logo-icon.svg",
    width: 32,
    height: 32,
  },
  wordmark: {
    light: "/brand/settler/logo-horizontal.svg",
    dark: "/brand/settler/logo-horizontal.svg",
    width: 520,
    height: 160,
  },
} as const;

export function SettlerLogo({
  variant = "horizontal",
  theme = "auto",
  className,
  priority = false,
  alt = "Settler",
}: SettlerLogoProps) {
  const config = LOGO_CONFIG[variant];

  if (theme === "light" || theme === "dark") {
    return (
      <Image
        src={theme === "dark" ? config.dark : config.light}
        alt={alt}
        width={config.width}
        height={config.height}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <>
      <Image
        src={config.light}
        alt={alt}
        width={config.width}
        height={config.height}
        className={cn(className, "dark:hidden")}
        priority={priority}
      />
      <Image
        src={config.dark}
        alt={alt}
        width={config.width}
        height={config.height}
        className={cn("hidden dark:block", className)}
        priority={priority}
      />
    </>
  );
}
