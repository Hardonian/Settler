/**
 * Ops Briefings View Component
 * 
 * Displays weekly founder briefings
 * 
 * Performance optimizations:
 * - Caching with TTL
 * - Memoized computations
 * - Lazy loading
 * - Error handling
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-ops-intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { cache } from '@/lib/ops-intelligence/cache';
import {
  CACHE_TTL_BRIEFINGS,
  DEFAULT_BRIEFING_PAGE_SIZE,
} from '@/lib/ops-intelligence/constants';
import {
  retryWithBackoff,
  formatDateRange,
  validatePagination,
} from '@/lib/ops-intelligence/utils';

interface Briefing {
  id: string;
  period_start: string;
  period_end: string;
  summary_markdown: string;
  summary_json: any;
  insights_count: number;
  recommendations_count: number;
  actions_count: number;
  generated_at: string;
}

interface BriefingsViewProps {
  userId: string;
}

export function BriefingsView({ userId }: BriefingsViewProps) {
  usePerformanceMonitor('BriefingsView');
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load briefings with caching and retry
  const loadBriefings = useCallback(async () => {
    const cacheKey = `briefings:${page}`;
    const cached = cache.get<{ briefings: Briefing[]; pagination: any }>(cacheKey);
    if (cached) {
      setBriefings(cached.briefings);
      setTotalPages(cached.pagination?.totalPages || 1);
      if (cached.briefings.length > 0 && !selectedBriefing) {
        setSelectedBriefing(cached.briefings[0]);
      }
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { page: validPage, limit: validLimit } = validatePagination(
        page,
        DEFAULT_BRIEFING_PAGE_SIZE
      );
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
      });

      const data = await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(`/api/console/ops-briefings?${params}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } finally {
          clearTimeout(timeoutId);
        }
      });

      const briefingsData = data.briefings || [];
      const paginationData = data.pagination || { totalPages: 1 };

      // Cache the result
      cache.set(
        cacheKey,
        { briefings: briefingsData, pagination: paginationData },
        CACHE_TTL_BRIEFINGS
      );

      setBriefings(briefingsData);
      setTotalPages(paginationData.totalPages || 1);

      // Auto-select latest briefing
      if (briefingsData.length > 0 && !selectedBriefing) {
        setSelectedBriefing(briefingsData[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load briefings';
      setError(errorMessage);
      console.error('Error loading briefings:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedBriefing]);

  // Load briefing detail
  const loadBriefingDetail = useCallback(async (briefingId: string) => {
    const cacheKey = `briefing-detail:${briefingId}`;
    const cached = cache.get<Briefing>(cacheKey);
    if (cached) {
      setSelectedBriefing(cached);
      return;
    }

    try {
      const data = await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(`/api/console/ops-briefings/${briefingId}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } finally {
          clearTimeout(timeoutId);
        }
      });

      cache.set(cacheKey, data, CACHE_TTL_BRIEFINGS);
      setSelectedBriefing(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load briefing';
      setError(errorMessage);
      console.error('Error loading briefing detail:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBriefings();
  }, [loadBriefings]);

  // Memoized date formatting
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Memoized date range
  const selectedDateRange = useMemo(() => {
    if (!selectedBriefing) return '';
    return formatDateRange(selectedBriefing.period_start, selectedBriefing.period_end);
  }, [selectedBriefing]);

  // Memoized summary stats
  const summaryStats = useMemo(() => {
    if (!selectedBriefing?.summary_json) return null;
    const metrics = selectedBriefing.summary_json.metrics || {};
    const insights = selectedBriefing.summary_json.insights || {};
    const recommendations = selectedBriefing.summary_json.recommendations || {};
    const actions = selectedBriefing.summary_json.actions || {};

    return {
      totalCost: metrics.totalCost ? Number(metrics.totalCost).toFixed(2) : 'N/A',
      criticalIssues: insights.bySeverity?.critical || 0,
      highPriorityRecs: recommendations.byRiskLevel?.high || 0,
      verifiedActions: actions.verified || 0,
    };
  }, [selectedBriefing]);

  if (loading && briefings.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading briefings...</p>
      </div>
    );
  }

  if (error && briefings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Briefings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadBriefings}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Briefings List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Briefings</CardTitle>
            <CardDescription>Select a briefing to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              {briefings.map((briefing) => (
                <Card
                  key={briefing.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedBriefing?.id === briefing.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedBriefing(briefing);
                    loadBriefingDetail(briefing.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(briefing.period_start)} - {formatDate(briefing.period_end)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {briefing.insights_count} insights
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {briefing.recommendations_count} recs
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {briefing.actions_count} actions
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(briefing.generated_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2 text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Briefing Detail */}
      <div className="lg:col-span-2">
        {selectedBriefing ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Weekly Founder Briefing</CardTitle>
                  <CardDescription className="mt-1">{selectedDateRange}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge>{selectedBriefing.insights_count} Insights</Badge>
                  <Badge>{selectedBriefing.recommendations_count} Recommendations</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {selectedBriefing.summary_markdown}
              </div>

              {/* Summary Stats */}
              {summaryStats && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {summaryStats.totalCost === 'N/A'
                          ? 'N/A'
                          : `$${summaryStats.totalCost}`}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{summaryStats.criticalIssues}</div>
                      <div className="text-sm text-muted-foreground">Critical Issues</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{summaryStats.highPriorityRecs}</div>
                      <div className="text-sm text-muted-foreground">High-Priority Recs</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{summaryStats.verifiedActions}</div>
                      <div className="text-sm text-muted-foreground">Verified Actions</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a briefing to view details
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
