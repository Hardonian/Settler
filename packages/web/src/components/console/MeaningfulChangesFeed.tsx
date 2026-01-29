/**
 * Meaningful Changes Feed Component
 * 
 * Displays changes ranked by impact, urgency, and confidence.
 * Each change shows: summary, why it matters, evidence, impact, and suggested next step.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Info, TrendingUp, ArrowRight } from 'lucide-react';
import type { MeaningfulChange } from '@/lib/domain/types';

interface MeaningfulChangesFeedProps {
  tenantId?: string;
  limit?: number;
}

export function MeaningfulChangesFeed({ limit = 50 }: MeaningfulChangesFeedProps) {
  const [changes, setChanges] = useState<MeaningfulChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    severity?: 'info' | 'warning' | 'critical';
    minRiskScore?: number;
  }>({});

  useEffect(() => {
    fetchChanges();
  }, [filters]);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.minRiskScore !== undefined) params.append('minRiskScore', filters.minRiskScore.toString());
      params.append('limit', limit.toString());

      const res = await fetch(`/api/console/meaningful-changes?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch changes: ${res.status}`);
      }

      const data = await res.json();
      setChanges(data.changes || []);
    } catch (error: unknown) {
      console.error('Failed to fetch meaningful changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load changes');
      setChanges([]);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: MeaningfulChange['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getUrgencyIcon = (urgency: MeaningfulChange['urgency']) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading changes...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchChanges}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    severity: e.target.value ? (e.target.value as 'info' | 'warning' | 'critical') : undefined,
                  })
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Min Risk Score</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.minRiskScore ?? ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minRiskScore: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="px-3 py-2 border rounded-md w-24"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes List */}
      {changes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No changes detected</h3>
            <p className="text-slate-600 dark:text-slate-400">
              All systems are in sync. Changes will appear here when detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => (
            <Card key={change.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getUrgencyColor(change.urgency)}>
                        {getUrgencyIcon(change.urgency)}
                        <span className="ml-1 capitalize">{change.urgency}</span>
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(change.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{change.explanation.summary}</CardTitle>
                    <CardDescription className="mt-2">
                      {change.explanation.whyItMatters}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Impact */}
                  {change.impact.currency && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Impact</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              change.impact.currency.amount,
                              change.impact.currency.currency
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Risk Score</p>
                          <p className="text-2xl font-bold">
                            {Math.round(change.impact.riskScore * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evidence */}
                  {change.explanation.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Evidence</p>
                      <div className="flex flex-wrap gap-2">
                        {change.explanation.evidence.map((evidence, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {evidence.type}: {evidence.value.substring(0, 20)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Next Step */}
                  {change.explanation.suggestedNextStep && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Suggested Next Step
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-400">
                            {change.explanation.suggestedNextStep}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Source: {change.event.sourceId}
                    </span>
                    <span>
                      {new Date(change.event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
