/**
 * Ops Insights View Component
 * 
 * Displays insights with filters, detail views, and action management
 */

'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

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

export function InsightsView({ userId }: InsightsViewProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: 'active',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInsights();
  }, [filters, page]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (filters.type) params.set('type', filters.type);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status) params.set('status', filters.status);

      const response = await fetch(`/api/console/ops-insights?${params}`);
      const data = await response.json();
      setInsights(data.insights || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsightDetail = async (insightId: string) => {
    try {
      const response = await fetch(`/api/console/ops-insights/${insightId}`);
      const data = await response.json();
      setSelectedInsight(data.insight);
      setRecommendations(data.recommendations || []);
      setActions(data.actions || []);
    } catch (error) {
      console.error('Error loading insight detail:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warn':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      cost: 'bg-purple-100 text-purple-700',
      support: 'bg-blue-100 text-blue-700',
      usage: 'bg-green-100 text-green-700',
      stability: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[type] || ''}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
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
  };

  if (loading && insights.length === 0) {
    return <div className="text-center py-12">Loading insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
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
              onValueChange={(value) => setFilters({ ...filters, severity: value })}
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
              onValueChange={(value) => setFilters({ ...filters, status: value })}
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

            <Button onClick={() => loadInsights()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
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
                <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                <span>{new Date(insight.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
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
              <Button
                variant="ghost"
                onClick={() => setSelectedInsight(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(selectedInsight.evidence, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Related Entities</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(selectedInsight.related_entities, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-4">
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{rec.action_type}</CardTitle>
                            <CardDescription className="mt-1">{rec.description}</CardDescription>
                          </div>
                          <Badge
                            className={
                              rec.risk_level === 'high'
                                ? 'bg-red-100 text-red-700'
                                : rec.risk_level === 'med'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
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
                            onClick={async () => {
                              if (!selectedInsight) return;
                              const response = await fetch(
                                `/api/console/ops-recommendations/${rec.id}/execute`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    actionTaken: `Executed: ${rec.description}`,
                                    outcomeNotes: 'Action taken via UI',
                                  }),
                                }
                              );
                              if (response.ok) {
                                await loadInsightDetail(selectedInsight.id);
                              }
                            }}
                          >
                            Execute Action
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <div className="space-y-4">
                  {actions.map((action) => (
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
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
