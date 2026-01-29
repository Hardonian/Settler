/**
 * Ops Insights View Component
 * 
 * Displays insights with filters, detail views, and action management
 * 
 * Performance optimizations:
 * - Caching with TTL
 * - Debounced filter changes
 * - Memoized computations
 * - Lazy loading
 * - Error boundaries
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-ops-intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Info, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import {
  cache,
  CACHE_TTL_INSIGHTS,
  DEFAULT_PAGE_SIZE,
  DEBOUNCE_DELAY_FILTERS,
  debounce,
  retryWithBackoff,
  formatConfidence,
  getRiskLevelColorClass,
  validatePagination,
  isValidUUID,
} from '@/lib/ops-intelligence';

interface Insight {
  id: string;
  type: 'cost' | 'support' | 'usage' | 'stability';
  title: string;
  summary: string;
  severity: 'info' | 'warn' | 'critical';
  confidence: number;
  status: string;
  created_at: string;
  evidence: any;
  related_entities: any;
}

interface Recommendation {
  id: string;
  action_type: string;
  description: string;
  risk_level: 'low' | 'med' | 'high';
  status: string;
  expected_impact: string;
  reversibility: boolean;
}

interface InsightsViewProps {
  userId: string;
}

export function InsightsView({ userId: _userId }: InsightsViewProps) {
  usePerformanceMonitor('InsightsView');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: 'active',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Memoized cache key
  const cacheKey = useMemo(
    () => `insights:${filters.type}:${filters.severity}:${filters.status}:${page}`,
    [filters.type, filters.severity, filters.status, page]
  );

  // Load insights with caching and retry
  const loadInsights = useCallback(async () => {
    // Check cache first
    const cached = cache.get<{ insights: Insight[]; pagination: any }>(cacheKey);
    if (cached) {
      setInsights(cached.insights);
      setTotalPages(cached.pagination?.totalPages || 1);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { page: validPage, limit: validLimit } = validatePagination(page, DEFAULT_PAGE_SIZE);
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: validLimit.toString(),
      });
      if (filters.type) params.set('type', filters.type);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status) params.set('status', filters.status);

      const data = await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const response = await fetch(`/api/console/ops-insights?${params}`, {
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

      const insightsData = data.insights || [];
      const paginationData = data.pagination || { totalPages: 1 };

      // Cache the result
      cache.set(cacheKey, { insights: insightsData, pagination: paginationData }, CACHE_TTL_INSIGHTS);

      setInsights(insightsData);
      setTotalPages(paginationData.totalPages || 1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load insights';
      setError(errorMessage);
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.severity, filters.status, page, cacheKey]);

  // Debounced filter change handler
  const debouncedLoadInsights = useMemo(
    () => debounce(loadInsights, DEBOUNCE_DELAY_FILTERS),
    [loadInsights]
  );

  // Load insight detail with caching
  const loadInsightDetail = useCallback(async (insightId: string) => {
    if (!isValidUUID(insightId)) {
      setError('Invalid insight ID');
      return;
    }

    setLoadingDetail(true);
    setError(null);

    try {
      const cacheKeyDetail = `insight-detail:${insightId}`;
      const cached = cache.get<{
        insight: Insight;
        recommendations: Recommendation[];
        actions: any[];
      }>(cacheKeyDetail);

      if (cached) {
        setSelectedInsight(cached.insight);
        setRecommendations(cached.recommendations);
        setActions(cached.actions);
        setLoadingDetail(false);
        return;
      }

      const data = await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(`/api/console/ops-insights/${insightId}`, {
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

      // Cache the result
      cache.set(
        cacheKeyDetail,
        {
          insight: data.insight,
          recommendations: data.recommendations || [],
          actions: data.actions || [],
        },
        CACHE_TTL_INSIGHTS
      );

      setSelectedInsight(data.insight);
      setRecommendations(data.recommendations || []);
      setActions(data.actions || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load insight details';
      setError(errorMessage);
      console.error('Error loading insight detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Execute recommendation
  const executeRecommendation = useCallback(async (recId: string, description: string) => {
    if (!isValidUUID(recId)) {
      setError('Invalid recommendation ID');
      return;
    }

    setExecutingAction(recId);
    setError(null);

    try {
      const response = await fetch(`/api/console/ops-recommendations/${recId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionTaken: `Executed: ${description}`,
          outcomeNotes: 'Action taken via UI',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Invalidate cache and reload
      cache.delete(`insight-detail:${selectedInsight?.id}`);
      if (selectedInsight) {
        await loadInsightDetail(selectedInsight.id);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute recommendation';
      setError(errorMessage);
      console.error('Error executing recommendation:', error);
    } finally {
      setExecutingAction(null);
    }
  }, [selectedInsight, loadInsightDetail]);

  // Initial load
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Memoized badge components
  const getSeverityIcon = useCallback((severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  }, []);

  const getSeverityBadge = useCallback((severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warn':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  }, []);

  const getTypeBadge = useCallback((type: string) => {
    const colors: Record<string, string> = {
      cost: 'bg-purple-100 text-purple-700',
      support: 'bg-blue-100 text-blue-700',
      usage: 'bg-green-100 text-green-700',
      stability: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'resolved':
        return <Badge className="bg-gray-100 text-gray-700">Resolved</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  // Memoized filtered insights count
  const insightsCount = useMemo(() => insights.length, [insights]);

  if (loading && insights.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading insights...</p>
      </div>
    );
  }

  if (error && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadInsights}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.type}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, type: value }));
                setPage(1); // Reset to first page
                debouncedLoadInsights();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
                <SelectItem value="stability">Stability</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.severity}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, severity: value }));
                setPage(1);
                debouncedLoadInsights();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => {
                setFilters((prev) => ({ ...prev, status: value }));
                setPage(1);
                debouncedLoadInsights();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadInsights} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      {insightsCount === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No insights found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedInsight(insight);
                loadInsightDetail(insight.id);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(insight.severity)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription className="mt-1">{insight.summary}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getTypeBadge(insight.type)}
                    {getSeverityBadge(insight.severity)}
                    {getStatusBadge(insight.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Confidence: {formatConfidence(insight.confidence)}</span>
                  <span>{new Date(insight.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedInsight.title}</CardTitle>
                <CardDescription className="mt-2">{selectedInsight.summary}</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedInsight(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading details...</p>
              </div>
            ) : (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="recommendations">
                    Recommendations ({recommendations.length})
                  </TabsTrigger>
                  <TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Evidence</h4>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(selectedInsight.evidence, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Related Entities</h4>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(selectedInsight.related_entities, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="mt-4">
                  <div className="space-y-4">
                    {recommendations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No recommendations available.
                      </p>
                    ) : (
                      recommendations.map((rec) => (
                        <Card key={rec.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{rec.action_type}</CardTitle>
                                <CardDescription className="mt-1">{rec.description}</CardDescription>
                              </div>
                              <Badge className={getRiskLevelColorClass(rec.risk_level)}>
                                {rec.risk_level}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                              Expected impact: {rec.expected_impact}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Reversible: {rec.reversibility ? 'Yes' : 'No'}
                            </p>
                            {rec.status === 'suggested' && (
                              <Button
                                onClick={() => executeRecommendation(rec.id, rec.description)}
                                disabled={executingAction === rec.id}
                              >
                                {executingAction === rec.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Executing...
                                  </>
                                ) : (
                                  'Execute Action'
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="mt-4">
                  <div className="space-y-4">
                    {actions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No actions taken yet.
                      </p>
                    ) : (
                      actions.map((action) => (
                        <Card key={action.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{action.action_taken}</CardTitle>
                            <CardDescription>
                              {new Date(action.executed_at).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Status: {action.verification_status}
                            </p>
                            {action.outcome_notes && (
                              <p className="text-sm mt-2">{action.outcome_notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
