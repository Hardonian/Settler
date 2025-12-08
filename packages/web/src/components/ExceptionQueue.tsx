/**
 * Exception Queue Component
 * UX-008: Exception management with filters, bulk actions, and resolution workflow
 * Future-forward: AI-powered resolution suggestions, auto-resolution, batch processing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Filter, Download, Sparkles } from '@/lib/lucide-react';

interface Exception {
  id: string;
  sourceId: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolutionStatus: 'open' | 'resolved' | 'ignored';
}

export function ExceptionQueue({ jobId }: { jobId?: string }) {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [selectedExceptions, setSelectedExceptions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: 'open',
    search: '',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    high: 0,
  });

  useEffect(() => {
    loadExceptions();
    loadStats();
  }, [jobId, filters]);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('jobId', jobId);
      if (filters.category) params.append('category', filters.category);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('resolutionStatus', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/v1/exceptions?${params.toString()}`);
      const data = await response.json();
      setExceptions(data.data || []);
    } catch (error) {
      console.error('Failed to load exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (jobId) params.append('jobId', jobId);

      const response = await fetch(`/api/v1/exceptions/stats?${params.toString()}`);
      const data = await response.json();
      setStats(data.data || { total: 0, open: 0, resolved: 0, high: 0 });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const resolveException = async (id: string, resolution: 'matched' | 'manual' | 'ignored', notes?: string) => {
    try {
      await fetch(`/api/v1/exceptions/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, notes }),
      });
      loadExceptions();
      loadStats();
    } catch (error) {
      console.error('Failed to resolve exception:', error);
    }
  };

  const bulkResolve = async (resolution: 'matched' | 'manual' | 'ignored') => {
    if (selectedExceptions.size === 0) return;

    try {
      await fetch('/api/v1/exceptions/bulk-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exceptionIds: Array.from(selectedExceptions),
          resolution,
        }),
      });
      setSelectedExceptions(new Set());
      loadExceptions();
      loadStats();
    } catch (error) {
      console.error('Failed to bulk resolve:', error);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedExceptions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedExceptions(newSelected);
  };

  const selectAll = () => {
    if (selectedExceptions.size === exceptions.length) {
      setSelectedExceptions(new Set());
    } else {
      setSelectedExceptions(new Set(exceptions.map(e => e.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exception Queue</h2>
          <p className="text-muted-foreground">Review and resolve unmatched transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{stats.high}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(v: string) => setFilters({ ...filters, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                  <SelectItem value="date_mismatch">Date Mismatch</SelectItem>
                  <SelectItem value="missing_transaction">Missing Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={filters.severity} onValueChange={(v: string) => setFilters({ ...filters, severity: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(v: string) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search exceptions..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExceptions.size > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{selectedExceptions.size} selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => bulkResolve('matched')}>
                  Mark as Matched
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkResolve('manual')}>
                  Mark as Manual
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkResolve('ignored')}>
                  Ignore
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No exceptions found. All transactions matched successfully!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox checked={selectedExceptions.size === exceptions.length} onCheckedChange={selectAll} />
                <span className="text-sm font-medium">Select All</span>
              </div>
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedExceptions.has(exception.id)}
                    onCheckedChange={() => toggleSelection(exception.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm">{exception.sourceId}</span>
                      <Badge variant={exception.severity === 'high' ? 'destructive' : 'secondary'}>
                        {exception.severity}
                      </Badge>
                      <Badge variant="outline">{exception.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{exception.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(exception.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveException(exception.id, 'matched')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Matched
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveException(exception.id, 'manual')}
                    >
                      Manual
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveException(exception.id, 'ignored')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Ignore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
