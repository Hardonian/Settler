'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Accessible loading spinner component
 * Provides visual feedback during async operations
 */
export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)} role="status" aria-live="polite">
      <div
        className={cn(
          'border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <span className="text-sm text-muted-foreground sr-only">{text}</span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
