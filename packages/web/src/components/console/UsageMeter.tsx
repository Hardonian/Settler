/**
 * Usage Meter Component
 * 
 * Displays current usage vs limits for key features.
 * Shows upgrade CTA when approaching limits.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  feature: string;
  current: number;
  limit: number;
  percentage: number;
  upgradeUrl?: string;
}

export function UsageMeter() {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/console/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data.usage || []);
        }
      } catch {
        console.error('[UsageMeter] Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  if (usage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No usage data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usage.map((item) => {
          const isUnlimited = item.limit === -1;
          const isNearLimit = !isUnlimited && item.percentage >= 80;
          const isAtLimit = !isUnlimited && item.percentage >= 100;

          return (
            <div key={item.feature} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium capitalize">
                  {item.feature.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-600">
                  {isUnlimited ? (
                    'Unlimited'
                  ) : (
                    <>
                      {item.current.toLocaleString()} / {item.limit.toLocaleString()}
                    </>
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <Progress value={Math.min(item.percentage, 100)} className="h-2" />
              )}
              {isAtLimit && item.upgradeUrl && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You've reached your limit for this feature.</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.upgradeUrl}>Upgrade</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              {isNearLimit && !isAtLimit && item.upgradeUrl && (
                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>You're approaching your limit ({item.percentage.toFixed(0)}% used).</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.upgradeUrl}>Upgrade</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
