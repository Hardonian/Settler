"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SyncRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  transactions_synced: number;
  errors_count: number;
  warnings_count: number;
  error_message: string | null;
}

export default function IntegrationLogsPage() {
  const params = useParams();
  const router = useRouter();
  const integrationId = params?.integrationId as string | undefined;
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (!integrationId) return;
    void fetchSyncRuns();
  }, [integrationId]);

  const fetchSyncRuns = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await (supabase as any)
        .from('app_private.memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      const tenantId = memberships?.[0]?.tenant_id;
      if (!tenantId) return;

      setCurrentTenantId(tenantId);

      // Get connector
      const { data: connector } = await supabase
        .from('connectors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('provider_id', integrationId)
        .single();

      if (!connector) return;

      // Get sync runs
      const { data: runs } = await supabase
        .from('sync_runs')
        .select('*')
        .eq('connector_id', connector.id)
        .order('started_at', { ascending: false })
        .limit(50);

      setSyncRuns((runs || []) as SyncRun[]);
    } catch (error) {
      console.error('Failed to fetch sync runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sync Logs - {integrationId}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View sync history and errors
          </p>
        </div>
        <Button onClick={fetchSyncRuns} variant="outline" className="ml-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent sync runs for this integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncRuns.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No sync runs found
              </p>
            ) : (
              syncRuns.map((run) => (
                <div
                  key={run.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(run.started_at).toLocaleString()}
                      </span>
                    </div>
                    {run.finished_at && (
                      <span className="text-xs text-gray-500">
                        Duration: {Math.round(
                          (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000
                        )}s
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Transactions:</span>{' '}
                      <span className="font-medium">{run.transactions_synced || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Errors:</span>{' '}
                      <span className="font-medium text-red-600">{run.errors_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Warnings:</span>{' '}
                      <span className="font-medium text-yellow-600">{run.warnings_count || 0}</span>
                    </div>
                  </div>
                  {run.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
                      {run.error_message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
