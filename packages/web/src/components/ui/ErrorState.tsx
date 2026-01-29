/**
 * Unified Error State Component
 * Provides consistent error UI across the application
 */

import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  variant?: 'default' | 'minimal' | 'full';
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  className?: string;
}

function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  variant = 'default',
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  className,
}: ErrorStateProps) {
  // Extract error message if Error object is provided
  const errorMessage = error?.message || message;

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg',
          className
        )}
        role="alert"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{errorMessage}</span>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-xs underline hover:no-underline"
            aria-label="Retry"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const sizeClasses = {
    default: 'p-8',
    full: 'min-h-screen p-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 text-center',
        sizeClasses[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full" />
        <div className="relative flex items-center justify-center w-16 h-16 bg-destructive/10 border-2 border-destructive/20 rounded-full">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>

      {/* Error Title */}
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>

      {/* Error Details (Development Only) */}
      {process.env.NODE_ENV === 'development' && error?.stack && (
        <details className="max-w-2xl w-full">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            View Stack Trace
          </summary>
          <pre className="mt-4 p-4 text-xs text-left bg-muted rounded-lg overflow-x-auto">
            {error.stack}
          </pre>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {showRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            aria-label="Retry action"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}

        {showHome && (
          <button
            onClick={onHome || (() => (window.location.href = '/'))}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors"
            aria-label="Go to homepage"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}

        {showBack && (
          <button
            onClick={onBack || (() => window.history.back())}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground max-w-md">
        If this problem persists, please{' '}
        <a href="/contact" className="underline hover:no-underline">
          contact support
        </a>
        .
      </p>
    </div>
  );
}

// Minimal inline error for form fields
function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-1 text-sm text-destructive', className)}
      role="alert"
    >
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}

// Export all variants
export { ErrorState, InlineError };
export default ErrorState;
