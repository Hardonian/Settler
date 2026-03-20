/**
 * Insights Panel
 * 
 * Displays actionable insights and recommendations.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, DollarSign, Zap, Lightbulb, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ConsoleErrorBoundary } from './ErrorBoundary';

interface Insight {
  id: string;
  type: 'cost_optimization' | 'performance' | 'usage_pattern' | 'anomaly' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: {
    label: string;
    url: string;
  };
  estimatedSavings?: number;
  confidence: number;
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
    // Refresh every hour
    const interval = setInterval(fetchInsights, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/console/insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      } else {
        // Handle non-200 responses gracefully
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch insights:', res.status, errorData);
        setInsights([]); // Show empty state
      }
    } catch (error: unknown) {
      console.error('Failed to fetch insights:', error);
      setInsights([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cost_optimization':
        return <DollarSign className="w-5 h-5" />;
      case 'performance':
        return <Zap className="w-5 h-5" />;
      case 'usage_pattern':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-border dark:bg-border rounded w-3/4"></div>
            <div className="h-4 bg-border dark:bg-border rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Insights
          </CardTitle>
          <CardDescription>Actionable recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No insights available yet</p>
            <p className="text-sm mt-1">We'll generate insights as you use Settler</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Insights
              </CardTitle>
              <CardDescription>
                {insights.length} actionable recommendation{insights.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh insights"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.slice(0, 5).map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${
                insight.severity === 'critical'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : insight.severity === 'warning'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10'
                  : 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded ${
                    insight.severity === 'critical'
                      ? 'bg-red-100 dark:bg-red-900/40'
                      : insight.severity === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-blue-100 dark:bg-blue-900/40'
                  }`}
                >
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    {getSeverityBadge(insight.severity)}
                    {insight.confidence < 0.8 && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Impact: {insight.impact}
                      </p>
                      {insight.estimatedSavings !== undefined && insight.estimatedSavings > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Potential savings: ${insight.estimatedSavings}/month
                        </p>
                      )}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={insight.action.url}>{insight.action.label}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {insights.length > 5 && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/console/insights">View All Insights</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </ConsoleErrorBoundary>
  );
}
