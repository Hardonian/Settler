/**
 * Graceful UI Degradation Patterns
 * 
 * Components and utilities for handling missing data and failures gracefully.
 */

'use client';

import React from 'react';
import { Loading, Skeleton } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '../logging/logger';
import { telemetry } from '../telemetry/events';

export interface FallbackProps {
  error?: Error;
  retry?: () => void;
  message?: string;
}

/**
 * Loading fallback with skeleton
 */
export function LoadingFallback({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton height="md" className="mb-4" />
          <Skeleton height="sm" width="md" />
        </Card>
      ))}
    </div>
  );
}

/**
 * Error fallback with retry
 */
export function ErrorFallback({ error, retry, message }: FallbackProps) {
  const handleRetry = () => {
    if (retry) {
      telemetry.trackEvent('error_retry', {
        error_message: error?.message,
        error_name: error?.name,
      });
      retry();
    }
  };

  return (
    <EmptyState
      iconVariant="alert"
      title="Something went wrong"
      description={message || error?.message || 'An error occurred while loading this content.'}
      action={
        retry
          ? {
              label: 'Try again',
              onClick: handleRetry,
              variant: 'default',
            }
          : undefined
      }
    />
  );
}

/**
 * Empty state fallback
 */
export function EmptyFallback({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  action,
}: {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <EmptyState
      iconVariant="inbox"
      title={title}
      description={description}
      action={action}
    />
  );
}

/**
 * Partial data fallback - shows what's available
 */
export function PartialDataFallback({
  children,
  missingDataMessage,
}: {
  children: React.ReactNode;
  missingDataMessage?: string;
}) {
  return (
    <div className="space-y-4">
      {children}
      {missingDataMessage && (
        <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {missingDataMessage}
          </p>
        </Card>
      )}
    </div>
  );
}

/**
 * Timeout fallback
 */
export function TimeoutFallback({ retry }: { retry?: () => void }) {
  const handleRetry = () => {
    if (retry) {
      telemetry.trackEvent('timeout_retry');
      retry();
    }
  };

  return (
    <EmptyState
      iconVariant="alert"
      title="Request timed out"
      description="The request took too long to complete. Please check your connection and try again."
      action={
        retry
          ? {
              label: 'Retry',
              onClick: handleRetry,
              variant: 'default',
            }
          : undefined
      }
    />
  );
}

/**
 * Network error fallback
 */
export function NetworkErrorFallback({ retry }: { retry?: () => void }) {
  const handleRetry = () => {
    if (retry) {
      telemetry.trackEvent('network_error_retry');
      retry();
    }
  };

  return (
    <EmptyState
      iconVariant="alert"
      title="Connection error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={
        retry
          ? {
              label: 'Retry',
              onClick: handleRetry,
              variant: 'default',
            }
          : undefined
      }
    />
  );
}

/**
 * Higher-order component for error boundaries with fallbacks
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<FallbackProps>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundaryWrapper fallback={FallbackComponent}>
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  };
}

function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
}) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
      logger.error('Component error', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError && error) {
    const Fallback = fallback || ErrorFallback;
    return <Fallback error={error} retry={() => setHasError(false)} />;
  }

  return <>{children}</>;
}
