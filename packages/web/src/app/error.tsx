/**
 * Global Error Boundary (Next.js App Router)
 * 
 * Catches errors in the app directory and provides error reporting.
 * Provides helpful error messages and recovery options.
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logging/logger';
import { analytics } from '@/lib/analytics';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Log error
    logger.error('Global error boundary caught error', error, {
      digest: error.digest,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Track in analytics
    analytics.trackError(error, {
      message: error.message,
      type: 'global_error_boundary',
      digest: error.digest,
    });
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Wait a moment before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine if this is a network error
  const isNetworkError = error.message.includes('fetch') || 
                         error.message.includes('network') ||
                         error.message.includes('Failed to fetch');

  // Determine if this is an auth error
  const isAuthError = error.message.includes('unauthorized') ||
                      error.message.includes('authentication') ||
                      error.message.includes('session');

  // User-friendly error message
  let userMessage = error.message;
  if (isNetworkError) {
    userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (isAuthError) {
    userMessage = 'Your session may have expired. Please sign in again.';
  } else if (!error.message || error.message === 'NEXT_REDIRECT') {
    userMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <EmptyState
        icon={AlertCircle}
        title="Something went wrong"
        description={userMessage}
        action={{
          label: isRetrying ? 'Retrying...' : 'Try again',
          onClick: handleRetry,
          variant: 'default',
        }}
        secondaryAction={
          isAuthError
            ? {
                label: 'Sign in',
                onClick: () => {
                  window.location.href = '/signup';
                },
              }
            : {
                label: 'Go home',
                onClick: () => {
                  window.location.href = '/';
                },
              }
        }
        className="max-w-md"
      />

      {/* Additional help for production */}
      {process.env.NODE_ENV === 'production' && error.digest && (
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Error ID: {error.digest}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/status">
                Check System Status
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/support">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
