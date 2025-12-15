/**
 * AI Insights Page
 * 
 * Full page view of all AI-powered insights and recommendations.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, DollarSign, Zap, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/console/insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
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

  const groupedInsights = {
    cost_optimization: insights.filter((i) => i.type === 'cost_optimization'),
    performance: insights.filter((i) => i.type === 'performance'),
    usage_pattern: insights.filter((i) => i.type === 'usage_pattern'),
    other: insights.filter((i) => !['cost_optimization', 'performance', 'usage_pattern'].includes(i.type)),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          AI Insights
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Actionable recommendations powered by AI to optimize your usage and reduce costs.
        </p>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We'll generate insights as you use Settler. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
            <TabsTrigger value="cost">
              Cost ({groupedInsights.cost_optimization.length})
            </TabsTrigger>
            <TabsTrigger value="performance">
              Performance ({groupedInsights.performance.length})
            </TabsTrigger>
            <TabsTrigger value="usage">
              Usage ({groupedInsights.usage_pattern.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            {groupedInsights.cost_optimization.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {groupedInsights.performance.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            {groupedInsights.usage_pattern.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
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

  return (
    <Card
      className={
        insight.severity === 'critical'
          ? 'border-red-500'
          : insight.severity === 'warning'
          ? 'border-amber-400'
          : ''
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${
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
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{insight.title}</h3>
              {getSeverityBadge(insight.severity)}
              {insight.confidence < 0.8 && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              {insight.description}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Impact: {insight.impact}
                </p>
                {insight.estimatedSavings !== undefined && insight.estimatedSavings > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Potential savings: ${insight.estimatedSavings}/month
                  </p>
                )}
              </div>
              <Button asChild>
                <Link href={insight.action.url}>{insight.action.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
