"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackTitle?: string;
  fallbackCaption?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * SafeImage component with robust error handling
 * 
 * Features:
 * - Graceful fallback UI if image fails to load
 * - Maintains aspect ratio to prevent CLS
 * - Accessible with proper alt text
 * - Production-safe: never crashes the page
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  fallbackTitle,
  fallbackCaption,
  className,
  containerClassName,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate aspect ratio for fallback - ensure width/height are numbers
  const widthNum = typeof width === 'number' ? width : (typeof width === 'string' ? parseFloat(width) : 0);
  const heightNum = typeof height === 'number' ? height : (typeof height === 'string' ? parseFloat(height) : 0);
  const aspectRatio = widthNum > 0 && heightNum > 0 ? heightNum / widthNum : 16 / 9;
  const aspectRatioPercent = aspectRatio * 100;

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // Log warning in dev only
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SafeImage] Failed to load image: ${src}`);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If error, show styled fallback
  if (hasError) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          "bg-slate-100 dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "rounded-lg",
          containerClassName
        )}
        style={{
          width: widthNum || '100%',
          aspectRatio: widthNum && heightNum ? `${widthNum} / ${heightNum}` : undefined,
          paddingBottom: !widthNum || !heightNum ? `${aspectRatioPercent}%` : undefined,
        }}
        role="img"
        aria-label={alt || fallbackTitle || "Image"}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {fallbackTitle && (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {fallbackTitle}
            </p>
          )}
          {fallbackCaption && (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {fallbackCaption}
            </p>
          )}
          {!fallbackTitle && !fallbackCaption && (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Image unavailable
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render image with error handling
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isLoading && "bg-slate-100 dark:bg-slate-800 animate-pulse",
        containerClassName
      )}
      style={{
        width: widthNum || '100%',
        aspectRatio: widthNum && heightNum ? `${widthNum} / ${heightNum}` : undefined,
      }}
    >
      <Image
        src={src}
        alt={alt || fallbackTitle || ""}
        width={widthNum > 0 ? widthNum : width}
        height={heightNum > 0 ? heightNum : height}
        className={cn(
          "transition-opacity duration-300 w-full h-full",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
}
