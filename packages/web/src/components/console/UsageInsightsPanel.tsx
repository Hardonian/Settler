/**
 * Usage Insights Panel
 * 
 * Displays usage insights and recommendations for UI emphasis.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Loader2 } from 'lucide-react';
import { UIEmphasis } from '@/lib/feedback-loops/usage-insights-service';

export function UsageInsightsPanel() {
  const [insights, setInsights] = useState<UIEmphasis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch('/api/console/insights');
        if (response.ok) {
          const data = await response.json();
          setInsights(data.emphasis || []);
        }
      } catch (error: unknown) {
        console.error('Failed to fetch usage insights:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Insights</CardTitle>
          <CardDescription>Analyzing your usage patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Insights</CardTitle>
          <CardDescription>We'll show recommendations based on your usage patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Start using Settler to see personalized recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const highlightInsights = insights.filter((i) => i.emphasis === 'highlight');
  const promoteInsights = insights.filter((i) => i.emphasis === 'promote');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Usage Insights
        </CardTitle>
        <CardDescription>
          Recommendations based on your usage patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlightInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              Frequently Used
            </h4>
            <div className="space-y-2">
              {highlightInsights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm font-medium">{insight.feature}</span>
                  <Badge variant="success" size="sm">Highlight</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {promoteInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Recommended
            </h4>
            <div className="space-y-2">
              {promoteInsights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm">{insight.feature}</span>
                  <Badge variant="secondary" size="sm">Promote</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {highlightInsights.length === 0 && promoteInsights.length === 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No specific recommendations at this time. Keep using Settler to see personalized insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
