/**
 * Global Error Handler (Next.js App Router)
 * 
 * Catches errors in the root layout.
 */

'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logging/logger';
import { analytics } from '@/lib/analytics';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    logger.critical('Global error handler caught error', error, {
      digest: error.digest,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Track in analytics
    analytics.trackError(error, {
      type: 'global_error',
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
