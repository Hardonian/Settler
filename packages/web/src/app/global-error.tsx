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
      message: error.message,
      type: 'global_error',
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0f172a', // Slate 900
        color: 'white',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
        }}>
          {/* Logo or Brand */}
          <div style={{ marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
            Settler.dev
          </div>

          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>
            System Error
          </h1>
          
          <p style={{ marginBottom: '3rem', color: '#94a3b8', maxWidth: '500px', lineHeight: 1.6 }}>
            The application encountered a critical error and needs to restart. 
            We've logged this issue and our engineering team has been notified.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#2563eb', // Blue 600
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'background-color 0.2s',
              }}
            >
              Try Again
            </button>
            
            <a 
              href="/"
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
