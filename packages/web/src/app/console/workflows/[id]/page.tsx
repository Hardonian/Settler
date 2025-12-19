'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { safeFetch } from '@/lib/safe-fetch';
import { ArrowLeft, Save, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';

interface Workflow {
  id: string;
  name: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  enabled: boolean;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    setLoading(true);
    const result = await safeFetch<Workflow>(`/api/workflows/${workflowId}`);
    
    if (result.success && result.data) {
      setWorkflow(result.data);
    } else {
      setError(result.error?.message || 'Failed to load workflow');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!workflow) return;
    
    setSaving(true);
    const result = await safeFetch(`/api/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify(workflow),
    });

    if (result.success) {
      alert('Workflow saved');
    } else {
      alert(result.error?.message || 'Failed to save workflow');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    const result = await safeFetch(`/api/workflows/${workflowId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      window.location.href = '/console/workflows';
    } else {
      alert(result.error?.message || 'Failed to delete workflow');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load workflow"
          message={error || 'Workflow not found'}
          onRetry={loadWorkflow}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/console/workflows">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{workflow.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Edit workflow configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enabled</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enable or disable this workflow
              </p>
            </div>
            <Switch
              checked={workflow.enabled}
              onCheckedChange={(enabled) => setWorkflow({ ...workflow, enabled })}
            />
          </div>

          <div>
            <Label>Trigger</Label>
            <Select 
              value={workflow.trigger.type} 
              onValueChange={(type) => setWorkflow({ ...workflow, trigger: { ...workflow.trigger, type } })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reconciliation.completed">Reconciliation Completed</SelectItem>
                <SelectItem value="anomaly.detected">Anomaly Detected</SelectItem>
                <SelectItem value="receipt.parsed">Receipt Parsed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Actions</Label>
            <div className="mt-2 space-y-2">
              {workflow.actions.map((action, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{action.type}</span>
                  </div>
                  <pre className="text-xs bg-slate-900 text-green-400 p-2 rounded overflow-x-auto">
                    {JSON.stringify(action.config, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
