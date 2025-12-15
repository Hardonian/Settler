/**
 * Fail-Safe Banner Component
 * 
 * Displays warnings and errors from fail-safe reconciliation operations,
 * ensuring users are aware of partial results or issues.
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { FailSafeResult } from '@/lib/fail-safe/reconciliation-fail-safe';

interface FailSafeBannerProps {
  result: FailSafeResult<unknown>;
  className?: string;
}

export function FailSafeBanner({ result, className = '' }: FailSafeBannerProps) {
  if (result.success && result.warnings.length === 0 && result.errors.length === 0) {
    return null;
  }

  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const isPartial = result.partial;

  const colorClasses = hasErrors
    ? {
        border: 'border-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-900 dark:text-red-300',
        textSecondary: 'text-red-800 dark:text-red-200',
        icon: AlertCircle,
        iconColor: 'text-red-600',
      }
    : hasWarnings || isPartial
    ? {
        border: 'border-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-900 dark:text-amber-300',
        textSecondary: 'text-amber-800 dark:text-amber-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
      }
    : {
        border: 'border-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-900 dark:text-blue-300',
        textSecondary: 'text-blue-800 dark:text-blue-200',
        icon: Info,
        iconColor: 'text-blue-600',
      };

  const Icon = colorClasses.icon;

  return (
    <Card className={`${colorClasses.border} ${colorClasses.bg} shadow-lg mb-6 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full ${colorClasses.bg} border-2 ${colorClasses.border} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colorClasses.iconColor}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${colorClasses.text} mb-2`}>
              {hasErrors
                ? 'Reconciliation Completed with Errors'
                : isPartial
                ? 'Partial Results Available'
                : hasWarnings
                ? 'Reconciliation Completed with Warnings'
                : 'Reconciliation Information'}
            </h3>

            {isPartial && (
              <p className={`${colorClasses.textSecondary} mb-3 text-sm`}>
                This reconciliation completed with partial results. Some transactions may not have been processed.
              </p>
            )}

            {result.errors.length > 0 && (
              <div className="mb-3">
                <p className={`${colorClasses.text} font-medium mb-2 text-sm`}>Errors:</p>
                <ul className={`${colorClasses.textSecondary} text-sm list-disc list-inside space-y-1`}>
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="mb-3">
                <p className={`${colorClasses.text} font-medium mb-2 text-sm`}>Warnings:</p>
                <ul className={`${colorClasses.textSecondary} text-sm list-disc list-inside space-y-1`}>
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.confidence && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className={`text-xs ${colorClasses.textSecondary}`}>
                  Confidence Level: <span className="font-medium capitalize">{result.confidence}</span>
                </p>
                {result.confidence === 'low' && (
                  <p className={`text-xs mt-1 ${colorClasses.textSecondary}`}>
                    Manual review strongly recommended.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
