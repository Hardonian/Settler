import Image from "next/image";
import { cn } from "@/lib/utils";

type SettlerLogoVariant = "horizontal" | "stacked" | "icon" | "wordmark";

interface SettlerLogoProps {
  variant?: SettlerLogoVariant;
  className?: string;
  priority?: boolean;
}

const BRAND_LOGOS: Record<
  SettlerLogoVariant,
  { src: string; alt: string; width: number; height: number }
> = {
  horizontal: {
    src: "/brand/settler/logo-primary-horizontal.svg",
    alt: "Settler logo",
    width: 160,
    height: 40,
  },
  stacked: {
    src: "/brand/settler/logo-stacked.svg",
    alt: "Settler stacked logo",
    width: 680,
    height: 680,
  },
  icon: {
    src: "/brand/settler/logo-icon.svg",
    alt: "Settler icon",
    width: 40,
    height: 40,
  },
  wordmark: {
    src: "/brand/settler/logo-wordmark.svg",
    alt: "Settler wordmark",
    width: 92,
    height: 16,
  },
};

export function SettlerLogo({
  variant = "horizontal",
  className,
  priority = false,
}: SettlerLogoProps) {
  const logo = BRAND_LOGOS[variant];

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      className={cn("h-auto w-auto", className)}
      priority={priority}
    />
  );
}
