'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { adminLogger } from '@/lib/admin/utils/logger';

/**
 * Admin Error Boundary
 *
 * Catches errors in admin routes and displays a friendly error message.
 * Never shows stack traces or sensitive information to users.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error via adminLogger
    adminLogger.error('Admin error page', error, {
      digest: error.digest,
    });
  }, [error]);

  // Determine if this is an auth error
  const isAuthError = error.message?.includes('auth') ||
                      error.message?.includes('unauthorized') ||
                      error.message?.includes('authentication') ||
                      error.message?.includes('Super admin access required');

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>
              {isAuthError ? 'Access Denied' : 'Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {isAuthError
              ? 'You do not have permission to access the admin panel.'
              : 'We encountered an error loading the admin panel.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
            </div>
          )}

          {!isAuthError && (
            <p className="text-sm text-muted-foreground">
              This might be a temporary issue. Please try again, or contact support if the problem persists.
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {isAuthError ? (
              <>
                <Button asChild variant="default">
                  <Link href="/signup">Sign In</Link>
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
                  <Link href="/admin">Back to Admin</Link>
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
