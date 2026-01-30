'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

/**
 * Public Billing Error Boundary
 *
 * Handles errors in public billing pages (pricing, checkout).
 * Must provide clear next steps and support options.
 */
export default function PublicBillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Public Billing Error]', {
      message: error.message,
      digest: error.digest,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>Oops! Something Went Wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an error loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
              <strong>No payment has been processed</strong>
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              If you were trying to subscribe or make a payment, don't worry - nothing has been charged.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">What you can do:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Return to the pricing page to start over</li>
              <li>Contact our support team for assistance</li>
            </ul>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">View Pricing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need help? Email us at{' '}
              <a
                href="mailto:support@settler.dev"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@settler.dev
              </a>
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Reference: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
