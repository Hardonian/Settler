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
      setStatus('error');
      setError('Missing session ID');
      return;
    }

    // Verify session and wait a moment for webhook to process
    const verifySession = async () => {
      try {
        // Give webhook time to process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Check billing status
        const response = await fetch('/api/console/billing');
        if (response.ok) {
          const data = await response.json();
          if (data.subscription) {
            setStatus('success');
          } else {
            setStatus('error');
            setError('Subscription not found. Please wait a moment and refresh.');
          }
        } else {
          setStatus('error');
          setError('Failed to verify subscription');
        }
      } catch {
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
