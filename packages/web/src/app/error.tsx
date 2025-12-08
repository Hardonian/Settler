/**
 * Global Error Boundary (Next.js App Router)
 * 
 * Catches errors in the app directory and provides error reporting.
 */

'use client';

import { useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from '@/components/ui/error-boundary';
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
      type: 'global_error_boundary',
      digest: error.digest,
    });
  }, [error]);

  return (
    <EmptyState
      iconVariant="alert"
      title="Something went wrong"
      description={
        error.message || 
        'An unexpected error occurred. Please try again or contact support if the problem persists.'
      }
      action={{
        label: 'Try again',
        onClick: reset,
        variant: 'default',
      }}
    />
  );
}
