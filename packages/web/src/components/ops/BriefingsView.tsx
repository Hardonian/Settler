/**
 * Ops Briefings View Component
 * 
 * Displays weekly founder briefings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
// Note: If react-markdown is not available, use a simple markdown renderer or plain text
// For now, we'll render as plain text with basic formatting

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
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBriefings();
  }, [page]);

  const loadBriefings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/console/ops-briefings?${params}`);
      const data = await response.json();
      setBriefings(data.briefings || []);
      setTotalPages(data.pagination?.totalPages || 1);

      // Auto-select latest briefing
      if (data.briefings && data.briefings.length > 0 && !selectedBriefing) {
        setSelectedBriefing(data.briefings[0]);
      }
    } catch (error) {
      console.error('Error loading briefings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && briefings.length === 0) {
    return <div className="text-center py-12">Loading briefings...</div>;
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
            <div className="space-y-2">
              {briefings.map((briefing) => (
                <Card
                  key={briefing.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedBriefing?.id === briefing.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBriefing(briefing)}
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
                  disabled={page === 1}
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
                  disabled={page === totalPages}
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
                  <CardDescription className="mt-1">
                    {formatDate(selectedBriefing.period_start)} -{' '}
                    {formatDate(selectedBriefing.period_end)}
                  </CardDescription>
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
              {selectedBriefing.summary_json && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {selectedBriefing.summary_json.metrics?.totalCost
                          ? `$${selectedBriefing.summary_json.metrics.totalCost.toFixed(2)}`
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {selectedBriefing.summary_json.insights?.bySeverity?.critical || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical Issues</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {selectedBriefing.summary_json.recommendations?.byRiskLevel?.high || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">High-Priority Recs</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {selectedBriefing.summary_json.actions?.verified || 0}
                      </div>
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
