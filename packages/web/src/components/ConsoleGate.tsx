'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface ConsoleGateProps {
  children: ReactNode;
  consolePath?: string;
  title?: string;
  description?: string;
}

export function ConsoleGate({ 
  children, 
  consolePath = '/console',
  title = 'Console Access Required',
  description = 'Access the Developer Console to use this feature. Subscribe to get started.'
}: ConsoleGateProps) {
  const { isAuthenticated, loading } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setCheckingSubscription(false);
      return;
    }

    // Check subscription status
    fetch('/api/console/subscription-status')
      .then(res => res.json())
      .then(data => {
        setHasSubscription(data.hasSubscription || false);
        setCheckingSubscription(false);
      })
      .catch(() => {
        setHasSubscription(false);
        setCheckingSubscription(false);
      });
  }, [isAuthenticated]);

  // Show loading state
  if (loading || checkingSubscription) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  // If not authenticated, show signup prompt
  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <Badge variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 mb-3">
            Authentication Required
          </Badge>
          <CardTitle className="text-2xl text-slate-900 dark:text-white mb-2">
            {title}
          </CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">With a subscription, you get:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Full access to the Developer Console</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Advanced monitoring and management tools</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Unlimited reconciliations</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Link href={`/signup?next=${encodeURIComponent(consolePath)}`}>
                Sign Up for Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-slate-300 dark:border-slate-700"
            >
              <Link href={`/pricing?next=${encodeURIComponent(consolePath)}`}>
                View Pricing
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If authenticated but no subscription, show upgrade prompt
  if (!hasSubscription) {
    return (
      <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <Badge variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 mb-3">
            Subscription Required
          </Badge>
          <CardTitle className="text-2xl text-slate-900 dark:text-white mb-2">
            Upgrade to Access Console
          </CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Subscribe to unlock the Developer Console and all advanced features.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">With a subscription, you get:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Full access to the Developer Console</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Advanced monitoring and management tools</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Unlimited reconciliations</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-electric-cyan flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Link href={`/pricing?next=${encodeURIComponent(consolePath)}`}>
                Start 30-Day Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-slate-300 dark:border-slate-700"
            >
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User has access - show children
  return <>{children}</>;
}
