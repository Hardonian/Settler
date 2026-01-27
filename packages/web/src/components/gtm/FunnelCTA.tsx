/**
 * Funnel CTA Component
 * 
 * PHASE 2: FUNNEL & CONVERSION CONTRACTS
 * 
 * Displays contextual next-step CTAs based on user's funnel stage.
 * No dead ends - every page has a clear next action.
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getNextAction, type FunnelStage } from '@/lib/gtm/funnels';

interface FunnelCTAProps {
  userId?: string;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function FunnelCTA({ userId, variant = 'card', className }: FunnelCTAProps) {
  const [stage, setStage] = useState<FunnelStage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStage() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Call API route instead of direct function call (client-side)
        const response = await fetch(`/api/gtm/funnel-stage?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStage(data.stage);
        }
      } catch {
        console.error('[FunnelCTA] Failed to load stage:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStage();
  }, [userId]);

  if (loading || !stage) {
    return null;
  }

  const nextAction = getNextAction(stage);
  if (!nextAction) {
    return null; // End of funnel
  }

  const isUpgrade = nextAction.type === 'upgrade';
  const isGate = nextAction.type === 'gate';

  if (variant === 'inline') {
    return (
      <Button
        asChild
        variant={isUpgrade ? 'default' : 'outline'}
        className={className}
      >
        <Link href={nextAction.url}>
          {nextAction.label}
          {isUpgrade && <Sparkles className="w-4 h-4 ml-2" />}
          {!isUpgrade && <ArrowRight className="w-4 h-4 ml-2" />}
        </Link>
      </Button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white mb-1">
              {isGate ? 'Unlock This Feature' : nextAction.label}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {isGate
                ? 'Upgrade your plan to access this feature'
                : 'Continue your journey with Settler'}
            </div>
          </div>
          <Button asChild variant={isUpgrade ? 'default' : 'outline'}>
            <Link href={nextAction.url}>
              {nextAction.label}
              {isUpgrade && <Sparkles className="w-4 h-4 ml-2" />}
              {!isUpgrade && <ArrowRight className="w-4 h-4 ml-2" />}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isGate && <Lock className="w-5 h-5 text-slate-400" />}
          {!isGate && <Sparkles className="w-5 h-5 text-blue-600" />}
          <CardTitle>
            {isGate ? 'Unlock This Feature' : 'Next Step'}
          </CardTitle>
        </div>
        <CardDescription>
          {isGate
            ? 'Upgrade your plan to access this feature'
            : 'Continue your journey with Settler'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant={isUpgrade ? 'default' : 'outline'} className="w-full">
          <Link href={nextAction.url}>
            {nextAction.label}
            {isUpgrade && <Sparkles className="w-4 h-4 ml-2" />}
            {!isUpgrade && <ArrowRight className="w-4 h-4 ml-2" />}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
