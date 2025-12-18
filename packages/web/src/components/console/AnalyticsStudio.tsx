/**
 * Analytics Studio Component
 * 
 * Tableau-style pivot dashboard with self-fueling cost & usage intelligence
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Save, BarChart3, Table as TableIcon, AlertCircle } from 'lucide-react';

interface Dataset {
  name: string;
  description: string;
  dimensions: Array<{ name: string; type: string; description: string }>;
  measures: Array<{ name: string; type: string; description: string }>;
  confidence?: boolean;
}

interface PivotQuery {
  dataset: string;
  rows: string[];
  columns: string[];
  measure: string;
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'p95';
  filters: Record<string, any>;
  dateRange?: { start: string; end: string };
}

interface PivotResult {
  data: Array<Record<string, any>>;
  totals: Record<string, any>;
  rowLabels: string[];
  columnLabels: string[];
}

interface SavedView {
  id: string;
  name: string;
  description?: string;
  dataset: string;
  rows: string[];
  columns: string[];
  measure: string;
  aggregation: string;
  filters: Record<string, any>;
  date_range?: { start: string; end: string };
}

export function AnalyticsStudio({ userId: _userId }: { userId: string }) {
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<string>('');
  const [selectedAggregation, setSelectedAggregation] = useState<'sum' | 'count' | 'avg' | 'min' | 'max' | 'p95'>('sum');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
  });
  const [pivotResult, setPivotResult] = useState<PivotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');

  // Load datasets
  useEffect(() => {
    fetch('/api/console/analytics/datasets')
      .then((res) => res.json())
      .then((data) => {
        setDatasets(data.datasets || {});
        const firstDataset = Object.keys(data.datasets || {})[0];
        if (firstDataset) {
          setSelectedDataset(firstDataset);
        }
      })
      .catch((err) => {
        console.error('Failed to load datasets:', err);
        setError('Failed to load datasets');
      });
  }, []);

  // Load saved views
  useEffect(() => {
    fetch('/api/console/analytics/saved-views')
      .then((res) => res.json())
      .then((data) => {
        setSavedViews(data.views || []);
      })
      .catch((err) => {
        console.error('Failed to load saved views:', err);
      });
  }, []);

  const currentDataset = datasets[selectedDataset];

  const executeQuery = async () => {
    if (!selectedDataset || !selectedMeasure) {
      setError('Please select a dataset and measure');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query: PivotQuery = {
        dataset: selectedDataset,
        rows: selectedRows,
        columns: selectedColumns,
        measure: selectedMeasure,
        aggregation: selectedAggregation,
        filters: {},
        dateRange,
      };

      const res = await fetch('/api/console/analytics/pivot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to execute query');
      }

      const result = await res.json();
      setPivotResult(result);
    } catch (err) {
      console.error('Query error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const saveView = async () => {
    if (!saveViewName.trim()) {
      setError('Please enter a view name');
      return;
    }

    try {
      const res = await fetch('/api/console/analytics/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveViewName,
          dataset: selectedDataset || '',
          rows: selectedRows,
          columns: selectedColumns,
          measure: selectedMeasure || '',
          aggregation: selectedAggregation,
          filters: {},
          dateRange,
          isPublic: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedViews([...savedViews, data.view]);
        setShowSaveDialog(false);
        setSaveViewName('');
      } else {
        throw new Error('Failed to save view');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save view');
    }
  };

  const loadView = (view: SavedView) => {
    setSelectedDataset(view.dataset);
    setSelectedRows(view.rows);
    setSelectedColumns(view.columns);
    setSelectedMeasure(view.measure);
    setSelectedAggregation(view.aggregation as any);
    if (view.date_range) {
      setDateRange(view.date_range);
    }
  };

  const exportCSV = () => {
    if (!pivotResult) return;

    const headers = [
      ...(currentDataset?.dimensions.filter((d) => selectedRows.includes(d.name)) || []).map((d) => d.name),
      ...pivotResult.columnLabels,
    ];

    const rows = pivotResult.data.map((row) => {
      return [
        ...selectedRows.map((r) => row[r] || ''),
        ...pivotResult.columnLabels.map((col) => row[col] || ''),
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedDataset}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Dataset Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset & Dimensions</CardTitle>
          <CardDescription>Select dataset and configure pivot dimensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Dataset</Label>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(datasets).map(([key, dataset]) => (
                    <SelectItem key={key} value={key}>
                      {dataset.name}
                      {dataset.confidence && (
                        <Badge variant="outline" className="ml-2">
                          Derived
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentDataset?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentDataset.description}
                </p>
              )}
            </div>

            <div>
              <Label>Measure</Label>
              <Select value={selectedMeasure} onValueChange={setSelectedMeasure}>
                <SelectTrigger>
                  <SelectValue placeholder="Select measure" />
                </SelectTrigger>
                <SelectContent>
                  {currentDataset?.measures.map((measure) => (
                    <SelectItem key={measure.name} value={measure.name}>
                      {measure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aggregation</Label>
              <Select
                value={selectedAggregation}
                onValueChange={(v) => setSelectedAggregation(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                  <SelectItem value="p95">95th Percentile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Row Dimensions (max 2)</Label>
              <Select
                value={selectedRows.join(',')}
                onValueChange={(v) => setSelectedRows(v ? v.split(',') : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select row dimensions" />
                </SelectTrigger>
                <SelectContent>
                  {currentDataset?.dimensions.map((dim) => (
                    <SelectItem key={dim.name} value={dim.name}>
                      {dim.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Column Dimensions (max 2)</Label>
              <Select
                value={selectedColumns.join(',')}
                onValueChange={(v) => setSelectedColumns(v ? v.split(',') : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column dimensions" />
                </SelectTrigger>
                <SelectContent>
                  {currentDataset?.dimensions.map((dim) => (
                    <SelectItem key={dim.name} value={dim.name}>
                      {dim.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={loading}>
              Execute Query
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="w-4 h-4 mr-2" />
              Save View
            </Button>
            {pivotResult && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedViews.map((view) => (
                <Button
                  key={view.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadView(view)}
                >
                  {view.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div>Loading...</div>
          </CardContent>
        </Card>
      )}

      {pivotResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Results</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="w-4 h-4 mr-2" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('chart')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Chart
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedRows.map((row) => (
                        <TableHead key={row}>{row}</TableHead>
                      ))}
                      {pivotResult.columnLabels.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pivotResult.data.map((row, idx) => (
                      <TableRow key={idx}>
                        {selectedRows.map((r) => (
                          <TableCell key={r}>{row[r] || '-'}</TableCell>
                        ))}
                        {pivotResult.columnLabels.map((col) => (
                          <TableCell key={col}>
                            {typeof row[col] === 'number'
                              ? row[col].toLocaleString()
                              : row[col] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {pivotResult.totals && (
                      <TableRow className="font-bold">
                        <TableCell colSpan={selectedRows.length}>Total</TableCell>
                        {pivotResult.columnLabels.map((col) => (
                          <TableCell key={col}>
                            {typeof pivotResult.totals[col] === 'number'
                              ? pivotResult.totals[col].toLocaleString()
                              : pivotResult.totals[col] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Chart view coming soon
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Save View</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>View Name</Label>
              <Input
                value={saveViewName}
                onChange={(e) => setSaveViewName(e.target.value)}
                placeholder="My Analytics View"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveView}>Save</Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
