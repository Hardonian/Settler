/**
 * Unified Loading State Component
 * Provides consistent loading UI across the application
 */

import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg' | 'full';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        'border-primary border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingSkeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 && 'w-4/5' // Last line is shorter
          )}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function LoadingState({
  variant = 'spinner',
  size = 'md',
  message,
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
    full: 'min-h-screen',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {variant === 'spinner' && <LoadingSpinner size={size === 'full' ? 'lg' : size} />}
      {variant === 'skeleton' && <LoadingSkeleton lines={5} />}
      {variant === 'pulse' && (
        <div className="w-full max-w-md space-y-4">
          <div className="h-12 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </div>
      )}
      {variant === 'dots' && <LoadingDots />}

      {message && (
        <p className="text-sm text-muted-foreground text-center max-w-md">{message}</p>
      )}
    </div>
  );
}

// Export all variants for convenience
export { LoadingState, LoadingSpinner, LoadingSkeleton, LoadingDots };
