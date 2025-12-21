'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Console Error Boundary
 * 
 * Catches errors in console routes and displays a friendly error message.
 * Never shows stack traces or sensitive information to users.
 */
export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    // Never log sensitive information
    const errorInfo = {
      message: error.message,
      digest: error.digest,
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
    };
    
    console.error('[Console Error Boundary]', errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // trackError('console_error', errorInfo);
    }
  }, [error]);

  // Determine if this is an auth error
  const isAuthError = error.message?.includes('auth') || 
                      error.message?.includes('unauthorized') ||
                      error.message?.includes('authentication');

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>
              {isAuthError ? 'Authentication Required' : 'Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {isAuthError 
              ? 'Please sign in to access the Developer Console.'
              : 'We encountered an error loading the Developer Console.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs font-mono text-red-800 dark:text-red-200 break-all">
                {error.message}
              </p>
            </div>
          )}
          
          {!isAuthError && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This might be a temporary issue. Please try again, or contact support if the problem persists.
            </p>
          )}
          
          <div className="flex gap-2 flex-wrap">
            {isAuthError ? (
              <>
                <Button asChild variant="default">
                  <Link href={`/signup?next=${encodeURIComponent('/console')}`}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Go Home</Link>
                </Button>
              </>
            ) : (
              <>
                <Button onClick={reset} variant="default">
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/console">Back to Console</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Go Home</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
