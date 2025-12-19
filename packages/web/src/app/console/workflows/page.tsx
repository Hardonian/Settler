'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { safeFetch } from '@/lib/safe-fetch';
import { Zap, Plus, Play, Pause, Settings, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { RBACGate, TruncateContent } from '@/lib/rbac-gate';

interface Workflow {
  id: string;
  name: string;
  trigger: {
    type: 'reconciliation.completed' | 'anomaly.detected' | 'receipt.parsed';
    config: Record<string, any>;
  };
  actions: Array<{
    type: 'http_webhook' | 'email' | 'slack';
    config: Record<string, any>;
  }>;
  enabled: boolean;
  lastRun?: {
    status: 'success' | 'failed';
    timestamp: Date;
    error?: string;
  };
}

const templates = [
  {
    name: 'Notify on Reconciliation Complete',
    trigger: { type: 'reconciliation.completed' as const },
    actions: [{ type: 'http_webhook' as const }],
  },
  {
    name: 'Alert on Anomaly',
    trigger: { type: 'anomaly.detected' as const },
    actions: [{ type: 'slack' as const }],
  },
  {
    name: 'Email Receipt Summary',
    trigger: { type: 'receipt.parsed' as const },
    actions: [{ type: 'email' as const }],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    const result = await safeFetch<{ workflows: Workflow[] }>('/api/workflows');
    
    if (result.success) {
      setWorkflows(result.data?.workflows || []);
    } else {
      // Mock data for demo
      setWorkflows([
        {
          id: '1',
          name: 'Notify Team on Completion',
          trigger: { type: 'reconciliation.completed', config: {} },
          actions: [{ type: 'http_webhook', config: { url: 'https://example.com/webhook' } }],
          enabled: true,
          lastRun: { status: 'success', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
        },
      ]);
    }
    setLoading(false);
  };

  const handleToggle = async (workflowId: string, enabled: boolean) => {
    const result = await safeFetch(`/api/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });

    if (result.success) {
      setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, enabled } : w));
    }
  };

  const handleTest = async (workflowId: string) => {
    const result = await safeFetch(`/api/workflows/${workflowId}/test`, {
      method: 'POST',
    });

    if (result.success) {
      alert('Dry run completed successfully');
    } else {
      alert(result.error?.message || 'Dry run failed');
    }
  };

  return (
    <RBACGate requiredTier="subscribed_unpaid" feature="Workflows">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Workflows</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Automate actions based on events (Zapier-style). 
              <span className="text-xs text-slate-500 ml-2">Create workflows that trigger when reconciliation completes, anomalies are detected, or receipts are parsed.</span>
            </p>
          </div>
          <RBACGate requiredTier="subscribed_paid" feature="Create Workflows">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
                Templates
              </Button>
              <Button asChild>
                <Link href="/console/workflows/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </div>
          </RBACGate>
        </div>

      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Templates</CardTitle>
            <CardDescription>Start from a template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/console/workflows/new?template=${index}`}>
                        Use Template
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Workflows</CardTitle>
          <CardDescription>Workspace-scoped workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No workflows yet"
              description="Create a workflow to automate actions based on events"
              action={{
                label: 'Create Workflow',
                onClick: () => window.location.href = '/console/workflows/new',
              }}
            />
          ) : (
            <TruncateContent tier="subscribed_unpaid" maxItems={10}>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white">{workflow.name}</h3>
                        <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                          {workflow.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div>
                          <strong>Trigger:</strong> {workflow.trigger.type}
                        </div>
                        <div>
                          <strong>Actions:</strong> {workflow.actions.map(a => a.type).join(', ')}
                        </div>
                        {workflow.lastRun && (
                          <div className="flex items-center gap-2 mt-2">
                            {workflow.lastRun.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span>
                              Last run: {new Date(workflow.lastRun.timestamp).toLocaleString()}
                              {workflow.lastRun.error && ` - ${workflow.lastRun.error}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(workflow.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggle(workflow.id, !workflow.enabled)}
                      >
                        {workflow.enabled ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/console/workflows/${workflow.id}`}>
                          <Settings className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </TruncateContent>
          )}
        </CardContent>
      </Card>
      </div>
    </RBACGate>
  );
}
