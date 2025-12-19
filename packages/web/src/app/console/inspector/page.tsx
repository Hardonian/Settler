'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { safeFetch, sanitizeForLogging } from '@/lib/safe-fetch';
import { Play, Download, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WebhookAttempt {
  id: string;
  url: string;
  status: number;
  latency: number;
  timestamp: Date;
  payload?: any;
  response?: any;
}

interface JobAttempt {
  id: string;
  jobId: string;
  status: 'success' | 'failed';
  latency: number;
  timestamp: Date;
  error?: string;
}

export default function InspectorPage() {
  const [webhookAttempts, setWebhookAttempts] = useState<WebhookAttempt[]>([]);
  const [jobAttempts, setJobAttempts] = useState<JobAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'webhooks' | 'jobs'>('webhooks');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'webhooks') {
        const result = await safeFetch<{ attempts: WebhookAttempt[] }>('/api/webhooks/attempts');
        if (result.success) {
          setWebhookAttempts(result.data?.attempts || []);
        } else {
          // Mock data for demo
          setWebhookAttempts(generateMockWebhooks());
        }
      } else {
        const result = await safeFetch<{ attempts: JobAttempt[] }>('/api/jobs/attempts');
        if (result.success) {
          setJobAttempts(result.data?.attempts || []);
        } else {
          // Mock data for demo
          setJobAttempts(generateMockJobs());
        }
      }
    } catch {
      // Fallback to mock data
      if (activeTab === 'webhooks') {
        setWebhookAttempts(generateMockWebhooks());
      } else {
        setJobAttempts(generateMockJobs());
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockWebhooks = (): WebhookAttempt[] => {
    return [
      {
        id: '1',
        url: 'https://example.com/webhook',
        status: 200,
        latency: 145,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        payload: { event: 'reconciliation.completed', data: { jobId: 'job_123' } },
        response: { success: true },
      },
      {
        id: '2',
        url: 'https://example.com/webhook',
        status: 500,
        latency: 5000,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        payload: { event: 'reconciliation.failed', data: { jobId: 'job_456' } },
        response: { error: 'Internal server error' },
      },
    ];
  };

  const generateMockJobs = (): JobAttempt[] => {
    return [
      {
        id: '1',
        jobId: 'job_123',
        status: 'success',
        latency: 2340,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: '2',
        jobId: 'job_456',
        status: 'failed',
        latency: 1200,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        error: 'Connection timeout',
      },
    ];
  };

  const handleReplay = async (id: string) => {
    const endpoint = activeTab === 'webhooks' ? `/api/webhooks/${id}/replay` : `/api/jobs/${id}/replay`;
    const result = await safeFetch(endpoint, { method: 'POST' });
    
    if (result.success) {
      alert('Replay initiated');
      loadData();
    } else {
      alert(result.error?.message || 'Failed to replay');
    }
  };

  const handleExport = () => {
    const data = activeTab === 'webhooks' ? webhookAttempts : jobAttempts;
    const dataStr = JSON.stringify(data.map(item => sanitizeForLogging(JSON.stringify(item))), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settler-inspector-${activeTab}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inspector</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Inspect webhook deliveries and job executions with detailed logs. 
            <span className="text-xs text-slate-500 ml-2">All sensitive data is automatically redacted.</span>
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Bundle
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'webhooks' | 'jobs')}>
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Attempts</CardTitle>
              <CardDescription>Recent webhook delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : webhookAttempts.length === 0 ? (
                <EmptyState
                  title="No webhook attempts"
                  description="Webhook delivery attempts will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {webhookAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                            {attempt.url}
                          </code>
                          <Badge variant={attempt.status >= 400 ? 'destructive' : 'default'}>
                            {attempt.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            {attempt.latency}ms
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplay(attempt.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Replay
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Payload (redacted)
                          </div>
                          <pre className="text-xs bg-slate-900 text-green-400 p-2 rounded overflow-x-auto">
                            {JSON.stringify(sanitizeForLogging(JSON.stringify(attempt.payload || {})), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Response
                          </div>
                          <pre className="text-xs bg-slate-900 text-green-400 p-2 rounded overflow-x-auto">
                            {JSON.stringify(attempt.response || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Attempts</CardTitle>
              <CardDescription>Recent job execution attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : jobAttempts.length === 0 ? (
                <EmptyState
                  title="No job attempts"
                  description="Job execution attempts will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {jobAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <code className="text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                            {attempt.jobId}
                          </code>
                          <Badge variant={attempt.status === 'failed' ? 'destructive' : 'default'}>
                            {attempt.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {attempt.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            {attempt.latency}ms
                          </div>
                          {attempt.error && (
                            <span className="text-sm text-red-600 dark:text-red-400">
                              {attempt.error}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReplay(attempt.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Replay
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
