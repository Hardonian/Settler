/**
 * Console Feature Flags Page
 * 
 * Manage feature flags: list, toggle, edit.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleLeft, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  isGlobal: boolean;
  defaultValue: unknown;
  environments: Array<{
    environment: string;
    enabled: boolean;
    variant?: unknown;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/console/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || []);
      }
    } catch {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagId: string, environment: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/console/feature-flags/${flagId}/environments/${environment}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        await fetchFlags();
      }
    } catch {
      console.error('Failed to toggle flag:', error);
    }
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Feature Flags
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage feature flags for your applications.
          </p>
        </div>
        <Button asChild>
          <a href="/console/docs#feature-flags">
            <Plus className="w-4 h-4 mr-2" />
            Create Flag
          </a>
        </Button>
      </div>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ToggleLeft className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No feature flags yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create your first feature flag to get started.
            </p>
            <Button asChild>
              <a href="/console/docs#feature-flags">View API Docs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => {
            const envSetting = flag.environments.find(
              (e) => e.environment === selectedEnvironment
            );
            const isEnabled = envSetting?.enabled ?? false;

            return (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {flag.key}
                        </code>
                        {flag.isGlobal && (
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Global
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {flag.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(flag)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">
                          {selectedEnvironment.charAt(0).toUpperCase() + selectedEnvironment.slice(1)} Environment
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Type: {flag.type} | Default: {String(flag.defaultValue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            handleToggleFlag(flag.id, selectedEnvironment, checked)
                          }
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Created: {format(new Date(flag.createdAt), 'PPp')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update flag settings for {editingFlag?.key}
            </DialogDescription>
          </DialogHeader>
          {editingFlag && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="env-select">Environment</Label>
                <select
                  id="env-select"
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-white dark:bg-slate-800"
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch
                  checked={
                    editingFlag.environments.find(
                      (e) => e.environment === selectedEnvironment
                    )?.enabled ?? false
                  }
                  onCheckedChange={(checked) =>
                    handleToggleFlag(editingFlag.id, selectedEnvironment, checked)
                  }
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
