'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Global Error Boundary
 *
 * Catches any unhandled errors in the app and displays a user-friendly message.
 * Never shows stack traces or technical details to users.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('Global error:', {
        message: error.message,
        digest: error.digest,
      });
    } else {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    We encountered an unexpected error. Please try again.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error.digest && (
                <p className="text-xs text-muted-foreground font-mono bg-muted/30 rounded px-2 py-1">
                  Error ID: {error.digest}
                </p>
              )}
              <div className="flex gap-3">
                <Button onClick={reset}>Try Again</Button>
                <Button asChild variant="outline">
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
