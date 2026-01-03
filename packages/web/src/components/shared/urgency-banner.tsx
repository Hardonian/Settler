/**
 * Urgency Banner Component
 * 
 * Reusable urgency indicators for pricing, billing, and upgrade flows.
 */

'use client';

import { AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LimitedTimeBanner({ 
  expiresAt,
  message 
}: { 
  expiresAt: Date;
  message?: string;
}) {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs <= 0) return null;

  const timeText = diffDays > 0 
    ? `${diffDays} day${diffDays > 1 ? 's' : ''} left`
    : diffHours > 0
    ? `${diffHours} hour${diffHours > 1 ? 's' : ''} left`
    : 'Expiring soon';

  return (
    <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-slate-900 dark:text-white mb-1">
              Limited Time Offer
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {message || `This offer expires in ${timeText}.`}
            </div>
            <Link href="/pricing">
              <Button size="sm" variant="default">
                View Offer
                <TrendingUp className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UpgradePromptBanner({ 
  feature,
  currentTier,
  recommendedTier 
}: { 
  feature: string;
  currentTier: string;
  recommendedTier: string;
}) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-slate-900 dark:text-white mb-1">
              Unlock {feature}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Upgrade from <strong>{currentTier}</strong> to <strong>{recommendedTier}</strong> to access this feature.
            </div>
            <Link href="/console/billing">
              <Button size="sm" variant="default">
                View Plans
                <TrendingUp className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
