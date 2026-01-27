/**
 * ROI Proof Block Component
 * 
 * PHASE 4: ROI & PROOF GENERATION
 * 
 * Displays computed proof artifacts showing real value delivered.
 * These are not marketing claims - they are computed from actual usage.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { type ROIMetrics } from '@/lib/gtm/value-events';

interface ROIProofBlockProps {
  billingAccountId?: string;
  periodDays?: number;
  className?: string;
}

export function ROIProofBlock({
  billingAccountId,
  periodDays = 30,
  className,
}: ROIProofBlockProps) {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billingAccountId) {
      setLoading(false);
      return;
    }

    async function loadMetrics() {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Call API route instead of direct function call (client-side)
        const response = await fetch(
          `/api/gtm/roi?billingAccountId=${billingAccountId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        if (response.ok) {
          const roi = await response.json();
          setMetrics(roi);
        }
      } catch {
        console.error('[ROIProofBlock] Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [billingAccountId, periodDays]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.totalReconciliations === 0) {
    return null; // Don't show empty proof blocks
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your Value Delivered</CardTitle>
        <CardDescription>
          Computed from your actual usage over the last {periodDays} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reconciliations */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalReconciliations.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Reconciliations completed
              </div>
            </div>
          </div>

          {/* Records Processed */}
          {metrics.totalRecordsProcessed > 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalRecordsProcessed.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Records processed
                </div>
              </div>
            </div>
          )}

          {/* Time Saved */}
          {metrics.totalTimeSavedHours > 0 && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalTimeSavedHours.toFixed(1)}h
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Estimated time saved
                </div>
              </div>
            </div>
          )}

          {/* Cost Savings */}
          {metrics.estimatedCostSavings > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${metrics.estimatedCostSavings.toFixed(0)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Estimated cost savings
                </div>
              </div>
            </div>
          )}

          {/* Exceptions Detected */}
          {metrics.exceptionsDetected > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.exceptionsDetected.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Exceptions detected
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {metrics.integrationsConnected > 0 && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.integrationsConnected}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Integrations connected
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Amount Reconciled */}
        {metrics.totalAmountReconciled > 0 && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total amount reconciled
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ${metrics.totalAmountReconciled.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
