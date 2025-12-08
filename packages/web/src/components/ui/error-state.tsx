/**
 * ErrorState Component
 * 
 * Reusable error state display component with consistent styling and accessibility.
 */

'use client';

import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  /**
   * Error message to display
   */
  error?: Error | string | null;
  /**
   * Title for the error state
   */
  title?: string;
  /**
   * Callback when retry is clicked
   */
  onRetry?: () => void;
  /**
   * Show retry button
   */
  showRetry?: boolean;
  /**
   * Custom retry button text
   */
  retryText?: string;
  /**
   * Show contact support option
   */
  showSupport?: boolean;
  /**
   * Support link/action
   */
  supportAction?: () => void;
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Additional className
   */
  className?: string;
}

export function ErrorState({
  error,
  title = 'Error loading data',
  onRetry,
  showRetry = true,
  retryText = 'Try Again',
  showSupport = false,
  supportAction,
  size = 'default',
  className,
}: ErrorStateProps) {
  // Extract user-friendly error message (avoid exposing internal details)
  const getErrorMessage = (): string => {
    if (!error) return 'An unexpected error occurred';
    
    if (error instanceof Error) {
      // Don't expose stack traces or internal error details
      const message = error.message;
      // Filter out technical details
      if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      if (message.includes('404') || message.includes('Not Found')) {
        return 'The requested resource was not found.';
      }
      if (message.includes('401') || message.includes('Unauthorized')) {
        return 'You are not authorized to access this resource.';
      }
      if (message.includes('403') || message.includes('Forbidden')) {
        return 'Access forbidden.';
      }
      if (message.includes('500') || message.includes('Server Error')) {
        return 'Server error. Please try again later.';
      }
      // Return sanitized message
      return message.length > 200 ? 'An unexpected error occurred' : message;
    }
    
    if (typeof error === 'string') {
      return error.length > 200 ? 'An unexpected error occurred' : error;
    }
    
    return 'An unexpected error occurred';
  };

  const errorMessage = getErrorMessage();
  
  // Ensure title is a proper heading level
  const HeadingTag = size === 'lg' ? 'h2' : size === 'sm' ? 'h4' : 'h3';

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-10 h-10',
      title: 'text-base',
      description: 'text-sm',
    },
    default: {
      container: 'py-12',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-lg',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4',
        currentSize.container,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle
        className={cn(
          'text-destructive mb-4',
          currentSize.icon,
          'motion-safe:animate-fade-in'
        )}
        aria-hidden="true"
      />
      <HeadingTag
        className={cn(
          'font-semibold text-foreground mb-2 text-center',
          currentSize.title
        )}
      >
        {title}
      </HeadingTag>
      <p
        className={cn(
          'text-muted-foreground text-center mb-6 max-w-md mx-auto',
          currentSize.description
        )}
      >
        {errorMessage}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            size={size === 'sm' ? 'sm' : 'default'}
            aria-label={retryText}
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {retryText}
          </Button>
        )}
        {showSupport && supportAction && (
          <Button
            onClick={supportAction}
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
            aria-label="Contact Support"
          >
            <HelpCircle className="w-4 h-4 mr-2" aria-hidden="true" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}
