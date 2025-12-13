/**
 * Feature Gate Component
 * 
 * Gates features based on subscription tier with upgrade prompts.
 */

'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'unauthenticated';

// Re-export for convenience
export type { SubscriptionTier as Tier };

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  upgradeMessage?: string;
  featureDescription?: string;
  className?: string;
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  unauthenticated: 'Sign In Required',
  free: 'Free Plan',
  pro: 'Pro Plan',
  enterprise: 'Enterprise',
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  unauthenticated: 'bg-slate-500',
  free: 'bg-blue-500',
  pro: 'bg-purple-500',
  enterprise: 'bg-gradient-to-r from-purple-600 to-pink-600',
};

export function FeatureGate({
  children,
  feature,
  requiredTier,
  currentTier,
  upgradeMessage,
  featureDescription,
  className,
}: FeatureGateProps) {
  const tierOrder: SubscriptionTier[] = ['unauthenticated', 'free', 'pro', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  const hasAccess = currentIndex >= requiredIndex;

  if (hasAccess) {
    return <>{children}</>;
  }

  const isUnauthenticated = currentTier === 'unauthenticated';
  const upgradeLink = isUnauthenticated ? '/signup' : '/console/billing';

  return (
    <div className={cn('relative', className)} role="region" aria-label={`Feature gate for ${feature}`}>
      {/* Blurred content preview */}
      <div className="blur-sm pointer-events-none opacity-50" aria-hidden="true">
        {children}
      </div>

      {/* Overlay with upgrade prompt */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg animate-in fade-in duration-300"
        role="dialog"
        aria-labelledby={`feature-gate-title-${feature}`}
        aria-describedby={`feature-gate-desc-${feature}`}
      >
        <Card className="max-w-md border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle id={`feature-gate-title-${feature}`} className="text-xl">
              {isUnauthenticated ? 'Sign In Required' : 'Upgrade to Unlock'}
            </CardTitle>
            <CardDescription id={`feature-gate-desc-${feature}`} className="mt-2">
              {upgradeMessage || `This feature requires ${TIER_NAMES[requiredTier]}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureDescription && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {featureDescription}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                Current: {TIER_NAMES[currentTier]}
              </Badge>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <Badge className={cn('text-xs text-white', TIER_COLORS[requiredTier])}>
                {TIER_NAMES[requiredTier]}
              </Badge>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href={upgradeLink}>
                {isUnauthenticated ? (
                  <>
                    Sign In to Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to {TIER_NAMES[requiredTier]}
                  </>
                )}
              </Link>
            </Button>

            {!isUnauthenticated && (
              <p className="text-xs text-center text-slate-500">
                <Link href="/pricing" className="underline hover:text-slate-700 dark:hover:text-slate-300">
                  View pricing plans
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Usage Limit Indicator
 */
interface UsageLimitProps {
  current: number;
  limit: number;
  label: string;
  tier: SubscriptionTier;
  className?: string;
}

export function UsageLimit({ current, limit, label, tier, className }: UsageLimitProps): JSX.Element {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  if (isUnlimited) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          Unlimited
        </Badge>
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className={cn(
          'font-medium',
          isAtLimit && 'text-red-600 dark:text-red-400',
          isNearLimit && !isAtLimit && 'text-amber-600 dark:text-amber-400',
          !isNearLimit && 'text-slate-700 dark:text-slate-300'
        )}>
          {current.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isAtLimit && 'bg-red-500',
            isNearLimit && !isAtLimit && 'bg-amber-500',
            !isNearLimit && 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {isAtLimit ? 'Limit reached' : 'Approaching limit'} —{' '}
          <Link href="/console/billing" className="underline">
            Upgrade for more
          </Link>
        </p>
      )}
    </div>
  );
}
