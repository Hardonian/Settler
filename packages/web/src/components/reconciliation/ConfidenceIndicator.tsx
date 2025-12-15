/**
 * Confidence Indicator Component
 * 
 * Displays confidence levels for reconciliation matches,
 * helping users understand when manual review is recommended.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  matchCount: number;
  totalCount: number;
  showDetails?: boolean;
  className?: string;
}

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  description: string;
}> = {
  high: {
    label: 'High Confidence',
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Matches are highly reliable. Manual review is optional.',
  },
  medium: {
    label: 'Medium Confidence',
    icon: AlertTriangle,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Some matches may need review. Recommended to verify results.',
  },
  low: {
    label: 'Low Confidence',
    icon: AlertCircle,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Manual review strongly recommended. Some matches may be incorrect.',
  },
  unknown: {
    label: 'Unknown Confidence',
    icon: Info,
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    description: 'Confidence level could not be determined.',
  },
};

export function ConfidenceIndicator({
  level,
  matchCount,
  totalCount,
  showDetails = false,
  className = '',
}: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[level];
  const Icon = config.icon;
  const percentage = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;

  const badge = (
    <Badge className={`${config.bgColor} ${config.color} border-0 flex items-center gap-1.5 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </Badge>
  );

  if (showDetails) {
    return (
      <div className="space-y-2">
        <div className="group relative inline-block">
          {badge}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <p className="font-medium mb-1 text-slate-900 dark:text-white">{config.label}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{config.description}</p>
            <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
              {matchCount} of {totalCount} transactions matched ({percentage}%)
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {config.description}
        </p>
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      {badge}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <p className="font-medium mb-1 text-slate-900 dark:text-white">{config.label}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{config.description}</p>
        <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">
          {matchCount} of {totalCount} transactions matched ({percentage}%)
        </p>
      </div>
    </div>
  );
}

/**
 * Calculate confidence level based on match statistics
 */
export function calculateConfidenceLevel(
  matchedCount: number,
  totalCount: number,
  unmatchedCount: number,
  conflictsCount: number
): ConfidenceLevel {
  if (totalCount === 0) {
    return 'unknown';
  }

  const matchRate = matchedCount / totalCount;
  const conflictRate = conflictsCount / totalCount;
  const unmatchedRate = unmatchedCount / totalCount;

  // High confidence: >95% match rate, <2% conflicts, <3% unmatched
  if (matchRate >= 0.95 && conflictRate < 0.02 && unmatchedRate < 0.03) {
    return 'high';
  }

  // Low confidence: <80% match rate OR >10% conflicts OR >15% unmatched
  if (matchRate < 0.80 || conflictRate > 0.10 || unmatchedRate > 0.15) {
    return 'low';
  }

  // Medium confidence: everything else
  return 'medium';
}
