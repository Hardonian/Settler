/**
 * Welcome Banner Component
 * 
 * Displays a welcome message after signup to acknowledge account creation
 * and guide users to their next action.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface WelcomeBannerProps {
  userName?: string;
  onDismiss?: () => void;
}

export function WelcomeBanner({ userName, onDismiss }: WelcomeBannerProps) {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if welcome param is present or if we should show based on localStorage
    const welcomeParam = searchParams?.get('welcome');
    const wasDismissed = typeof window !== 'undefined' 
      ? localStorage.getItem('settler_welcome_dismissed') === 'true'
      : false;
    
    if (welcomeParam === 'true' && !wasDismissed) {
      setIsVisible(true);
      // Clean up URL param after showing
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('welcome');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissal in localStorage to prevent showing again
    if (typeof window !== 'undefined') {
      localStorage.setItem('settler_welcome_dismissed', 'true');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                Welcome to Settler{userName ? `, ${userName}` : ''}!
              </h3>
            </div>
            <p className="text-green-800 dark:text-green-200 mb-2">
              Your reconciliation workspace is ready. Connect your data sources, run your first match, and review results.
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              Start by creating an API key, then try the playground to see how Settler matches records and surfaces mismatches.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/console/api-keys">
                  Create Your First API Key
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-green-300 text-green-700 dark:text-green-300">
                <Link href="/console/playground">
                  Try the Playground
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-green-700 dark:text-green-300">
                <Link href="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
