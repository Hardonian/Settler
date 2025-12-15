/**
 * Type-safe Settler image component
 * 
 * Provides a type-safe way to use Settler brand images throughout the app
 */

import Image from 'next/image';
import { getImageConfig, type SettlerImageKey } from '@/lib/images/image-config';
import { type ImageProps } from 'next/image';

interface SettlerImageProps extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> {
  imageKey: SettlerImageKey;
  className?: string;
  priority?: boolean;
}

/**
 * Type-safe Settler image component
 * 
 * @example
 * <SettlerImage imageKey="logoMain" className="h-12 w-auto" />
 * <SettlerImage imageKey="ogImage" width={1200} height={630} />
 */
export function SettlerImage({
  imageKey,
  className,
  priority = false,
  ...props
}: SettlerImageProps) {
  const config = getImageConfig(imageKey);

  return (
    <Image
      src={config.path}
      alt={config.alt}
      width={config.width}
      height={config.height}
      className={className}
      priority={priority}
      {...props}
    />
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

export function SettlerStaticImage({
  imageKey,
  className,
  alt,
}: SettlerStaticImageProps) {
  const config = getImageConfig(imageKey);

  return (
    <img
      src={config.path}
      alt={alt || config.alt}
      width={config.width}
      height={config.height}
      className={className}
    />
  );
}
