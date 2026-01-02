/**
 * Type-safe Settler image component
 *
 * Provides a type-safe way to use Settler brand images throughout the app
 * Fully responsive - fits horizontally on mobile portrait, can be cut off in landscape
 */

import Image from "next/image";
import { getImageConfig, type SettlerImageKey } from "@/lib/images/image-config";
import { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface SettlerImageProps extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  imageKey: SettlerImageKey;
  className?: string;
  priority?: boolean;
  responsive?: boolean; // Enable responsive behavior (default: true)
  preferWebP?: boolean; // Use WebP version if available (default: true for better performance)
}

/**
 * Type-safe Settler image component
 *
 * Responsive behavior:
 * - Mobile portrait: Fits horizontally, maintains aspect ratio
 * - Mobile landscape: Can be cut off horizontally, maintains aspect ratio
 * - Desktop: Full size with aspect ratio maintained
 *
 * @example
 * <SettlerImage imageKey="logoMain" className="h-12 w-auto" />
 * <SettlerImage imageKey="ogImage" responsive />
 */
export function SettlerImage({
  imageKey,
  className,
  priority = false,
  responsive = true,
  preferWebP = true,
  ...props
}: SettlerImageProps) {
  const config = getImageConfig(imageKey);
  // Use WebP if available and preferred for better performance
  const imageSrc = preferWebP && config.webpPath ? config.webpPath : config.path;

  const responsiveClasses = responsive
    ? "w-full h-auto max-w-full object-contain md:object-cover"
    : "";

  return (
    <div className={cn("relative overflow-hidden", responsive && "w-full")}>
      <Image
        src={imageSrc}
        alt={config.alt}
        width={config.width}
        height={config.height}
        className={cn(responsiveClasses, "transition-opacity duration-300", className)}
        priority={priority}
        sizes={responsive ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
        style={{
          objectFit: responsive ? "contain" : undefined,
          ...(responsive && {
            width: "100%",
            height: "auto",
          }),
        }}
        {...props}
      />
    </div>
  );
}

/**
 * Static image component for non-Next.js Image optimization scenarios
 */
interface SettlerStaticImageProps {
  imageKey: SettlerImageKey;
  className?: string;
  alt?: string;
}

export function SettlerStaticImage({ imageKey, className, alt }: SettlerStaticImageProps) {
  const config = getImageConfig(imageKey);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={config.path}
      alt={alt || config.alt}
      width={config.width}
      height={config.height}
      className={className}
    />
  );
}
