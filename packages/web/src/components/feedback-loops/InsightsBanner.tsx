/**
 * Insights Banner Component
 * 
 * Displays automatically generated insights from usage patterns.
 * Helps surface what's working and what needs attention.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';

interface UsageInsight {
  type: 'feature_popularity' | 'common_error' | 'dropoff_point' | 'success_pattern';
  insight: string;
  recommendation: string;
  confidence: number;
  lastUpdated: string;
}

export function InsightsBanner() {
  const [insights, setInsights] = useState<UsageInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch('/api/feedback-loops/insights');
        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        }
      } catch (error) {
        console.error('[Insights] Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading || insights.length === 0) {
    return null;
  }

  // Only show high-confidence insights
  const highConfidenceInsights = insights.filter(i => i.confidence >= 0.8);

  if (highConfidenceInsights.length === 0) {
    return null;
  }

  const getIcon = (type: UsageInsight['type']) => {
    switch (type) {
      case 'feature_popularity':
      case 'success_pattern':
        return TrendingUp;
      case 'common_error':
        return AlertCircle;
      case 'dropoff_point':
        return Target;
      default:
        return Lightbulb;
    }
  };

  const getColor = (type: UsageInsight['type']) => {
    switch (type) {
      case 'feature_popularity':
      case 'success_pattern':
        return 'text-green-600 dark:text-green-400';
      case 'common_error':
        return 'text-red-600 dark:text-red-400';
      case 'dropoff_point':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {highConfidenceInsights.slice(0, 2).map((insight, index) => {
        const Icon = getIcon(insight.type);
        const color = getColor(insight.type);

        return (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {insight.insight}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
