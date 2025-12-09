/**
 * Experiment Detail Page
 * 
 * View experiment details, results, and manage variants.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play } from 'lucide-react';

interface ExperimentResult {
  key: string;
  label: string;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
}

export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const experimentId = params.id as string;
  
  const [experiment, setExperiment] = useState<any>(null);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperiment();
    loadResults();
  }, [experimentId]);

  async function loadExperiment() {
    try {
      const response = await fetch(`/api/console/site/experiments/${experimentId}`);
      if (!response.ok) throw new Error('Failed to load experiment');
      const data = await response.json();
      setExperiment(data.experiment);
    } catch (error) {
      console.error('Error loading experiment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadResults() {
    try {
      const response = await fetch(`/api/console/site/experiments/${experimentId}/results`);
      if (!response.ok) return;
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }

  async function handleStart() {
    try {
      const response = await fetch(`/api/console/site/experiments/${experimentId}/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start experiment');
      await loadExperiment();
    } catch (error) {
      console.error('Error starting experiment:', error);
      alert('Failed to start experiment');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading experiment...</p>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Experiment not found</p>
        <Button variant="outline" onClick={() => router.push('/console/site/experiments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Experiments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/console/site/experiments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {experiment.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {experiment.targetPage?.seoTitle || experiment.targetPage?.slug}
            </p>
          </div>
          <Badge className={getStatusColor(experiment.status)}>
            {experiment.status}
          </Badge>
        </div>
        {experiment.status === 'draft' && (
          <Button onClick={handleStart}>
            <Play className="w-4 h-4 mr-2" />
            Start Experiment
          </Button>
        )}
      </div>

      {/* Results */}
      {experiment.status === 'running' && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Performance metrics by variant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.label}</h3>
                    <Badge variant="outline">{result.key}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">Views</div>
                      <div className="font-semibold">{result.views}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Clicks</div>
                      <div className="font-semibold">{result.clicks}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Conversions</div>
                      <div className="font-semibold">{result.conversions}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Conversion Rate</div>
                      <div className="font-semibold">{result.conversionRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Experiment variants and traffic split</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {experiment.variants?.map((variant: any) => (
              <div key={variant.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{variant.label}</div>
                  <div className="text-sm text-slate-500">{variant.key}</div>
                </div>
                <Badge variant="outline">
                  {(experiment.trafficSplit as Record<string, number>)?.[variant.key] || 0}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
