'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

/**
 * Analytics Error Boundary
 *
 * Prevents analytics failures from breaking the console.
 * Provides graceful degradation with alternative navigation.
 */
export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn('[Analytics Error]', {
      message: error.message,
      digest: error.digest,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <CardTitle>Analytics Unavailable</CardTitle>
          </div>
          <CardDescription>
            We couldn't load your analytics dashboard right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your data is safe. This is a temporary display issue that doesn't affect your account or data processing.
          </p>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={reset} variant="default">
              Retry
            </Button>
            <Button asChild variant="outline">
              <Link href="/console">Console Home</Link>
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 bg-muted/30 border rounded-lg p-3">
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-words">
                {error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
