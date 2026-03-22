import Image from "next/image";

type SettlerLogoVariant = "horizontal" | "icon" | "wordmark" | "stacked" | "square";

interface SettlerLogoProps {
  variant?: SettlerLogoVariant;
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  alt?: string;
}

const LOGO_CONFIG = {
  horizontal: {
    src: "/assets/images/Settler-logo.png",
    width: 1303,
    height: 339,
  },
  icon: {
    src: "/brand/settler/logo-icon.svg",
    width: 64,
    height: 64,
  },
  wordmark: {
    src: "/assets/images/Settler-logo.png",
    width: 1303,
    height: 339,
  },
  stacked: {
    src: "/assets/images/Settler-logo.png",
    width: 1303,
    height: 339,
  },
  square: {
    src: "/brand/settler/logo-square.svg",
    width: 64,
    height: 64,
  },
} as const;

export function SettlerLogo({
  variant = "horizontal",
  theme: _theme = "auto",
  className,
  priority = false,
  alt = "Settler",
}: SettlerLogoProps) {
  const config = LOGO_CONFIG[variant];

  return (
    <Image
      src={config.src}
      alt={alt}
      width={config.width}
      height={config.height}
      className={className}
      priority={priority}
    />
  );
}
