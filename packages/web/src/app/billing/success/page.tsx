'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      // If no session ID, still try to verify subscription status
      // User might have navigated here directly or session ID was lost
      const verifySession = async () => {
        try {
          const response = await fetch('/api/console/billing');
          if (response.ok) {
            const data = await response.json();
            if (data.subscription && data.subscription.status === 'active') {
              setStatus('success');
            } else {
              // No active subscription - might still be processing
              setStatus('loading');
              // Retry after delay
              setTimeout(() => {
                void verifySession();
              }, 3000);
            }
          } else {
            if (response.status === 401) {
              setStatus('error');
              setError('Please sign in to verify your subscription');
            } else {
              setStatus('error');
              setError('Failed to verify subscription. Please check your billing page.');
            }
          }
        } catch (err) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Failed to verify subscription');
        }
      };
      void verifySession();
      return;
    }

    // Verify session and wait a moment for webhook to process
    const verifySession = async () => {
      try {
        // Give webhook time to process (exponential backoff)
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempts + 1)));
          
          // Check billing status
          const response = await fetch('/api/console/billing');
          if (response.ok) {
            const data = await response.json();
            if (data.subscription && (data.subscription.status === 'active' || data.subscription.status === 'trialing')) {
              setStatus('success');
              return;
            }
          }
          
          attempts++;
        }
        
        // After max attempts, show error but allow manual check
        setStatus('error');
        setError('Subscription verification is taking longer than expected. Please check your billing page in a moment.');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to verify subscription');
      }
    };

    void verifySession();
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-slate-600 dark:text-slate-400">
                Verifying your subscription...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Verification Failed</CardTitle>
            </div>
            <CardDescription>{error || 'Unable to verify subscription'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your payment was processed, but we couldn't verify your subscription status.
              Please wait a moment and check your billing page.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/console/billing')}>
                Go to Billing
              </Button>
              <Button asChild variant="outline">
                <Link href="/console">Go to Console</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Subscription Activated</CardTitle>
          </div>
          <CardDescription>Your subscription has been successfully activated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Thank you for subscribing! Your plan is now active and you can start using all the features.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/console">Go to Console</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/console/billing">View Billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
