/**
 * Job Completion Banner Component
 * 
 * Displays explicit acknowledgment when a reconciliation job completes,
 * highlighting what was accomplished and next steps.
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface JobCompletionBannerProps {
  jobName: string;
  matchedCount: number;
  unmatchedCount: number;
  accuracy: number;
  completedAt: string;
  jobId: string;
  onDismiss?: () => void;
}

export function JobCompletionBanner({
  jobName,
  matchedCount,
  unmatchedCount,
  accuracy,
  completedAt,
  jobId,
  onDismiss,
}: JobCompletionBannerProps) {
  const isHighAccuracy = accuracy >= 95;
  const hasUnmatched = unmatchedCount > 0;

  return (
    <Card className={`border-2 shadow-lg mb-6 ${
      isHighAccuracy && !hasUnmatched
        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
        : hasUnmatched
        ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'
        : 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
    }`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isHighAccuracy && !hasUnmatched
                ? 'bg-green-500'
                : hasUnmatched
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}>
              {isHighAccuracy && !hasUnmatched ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : hasUnmatched ? (
                <AlertCircle className="w-6 h-6 text-white" />
              ) : (
                <TrendingUp className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isHighAccuracy && !hasUnmatched
                  ? 'Reconciliation Complete'
                  : hasUnmatched
                  ? 'Reconciliation Complete — Review Needed'
                  : 'Reconciliation Complete'}
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              <strong>{jobName}</strong> finished processing at {new Date(completedAt).toLocaleTimeString()}.
              {isHighAccuracy && !hasUnmatched ? (
                <> All {matchedCount.toLocaleString()} transactions matched successfully with {accuracy}% accuracy.</>
              ) : hasUnmatched ? (
                <> {matchedCount.toLocaleString()} transactions matched ({accuracy}% accuracy). {unmatchedCount} transaction{unmatchedCount !== 1 ? 's' : ''} need{unmatchedCount === 1 ? 's' : ''} your review.</>
              ) : (
                <> {matchedCount.toLocaleString()} transactions matched with {accuracy}% accuracy.</>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" variant={isHighAccuracy && !hasUnmatched ? 'default' : 'outline'}>
                <Link href={`/dashboard/jobs/${jobId}`}>
                  View Full Report
                </Link>
              </Button>
              {hasUnmatched && (
                <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                  <Link href={`/dashboard/jobs/${jobId}#unmatched`}>
                    Review Unmatched
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/jobs/${jobId}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/dashboard/jobs/${jobId}`}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rerun Job
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
