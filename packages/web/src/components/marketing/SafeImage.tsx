'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onError?: () => void;
}

/**
 * SafeImage component that gracefully handles image loading errors
 * Falls back to a styled placeholder if image fails to load
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  onError,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700',
          fill ? 'absolute inset-0' : '',
          className
        )}
        style={!fill && width && height ? { width, height } : undefined}
        role="img"
        aria-label={alt}
      >
        <div className="text-center p-4">
          <div className="text-slate-400 dark:text-slate-500 text-sm mb-1">Image unavailable</div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">{alt}</div>
        </div>
      </div>
    );
  }

  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      }
    : {
        width: width || 800,
        height: height || 600,
      };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fill ? 'absolute inset-0' : '',
        isLoading && 'bg-slate-100 dark:bg-slate-800 animate-pulse',
        className
      )}
      style={!fill && width && height ? { width, height } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        sizes={sizes}
      />
    </div>
  );
}
