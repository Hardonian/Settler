/**
 * JobForge Admin Console
 *
 * Minimal admin page for JobForge integration:
 * - Submit event
 * - Run module (dry-run)
 * - View report + request bundle execution (gated)
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type JobForgeStatus = {
  enabled: boolean;
  ready: boolean;
  missing: string[];
  bundleExecutionEnabled: boolean;
};

type JobForgeResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

type JobForgeJob = {
  id: string;
  type: string;
  status: string;
  result_id?: string | null;
};

type JobForgeResult = {
  id: string;
  job_id: string;
  tenant_id: string;
  result: Record<string, unknown>;
  artifact_ref: string | null;
  created_at: string;
};

type JobForgeReport = {
  job: JobForgeJob | null;
  result: JobForgeResult | null;
};

const defaultStatus: JobForgeStatus = {
  enabled: false,
  ready: false,
  missing: [],
  bundleExecutionEnabled: false,
};

function parseJson(value: string): Record<string, unknown> | null {
  if (!value.trim()) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function JobForgeAdminPage() {
  const [status, setStatus] = useState<JobForgeStatus>(defaultStatus);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [projectId, setProjectId] = useState('');

  const [eventName, setEventName] = useState('');
  const [eventPayload, setEventPayload] = useState('{}');
  const [eventResult, setEventResult] = useState<string | null>(null);

  const [moduleName, setModuleName] = useState('');
  const [moduleInput, setModuleInput] = useState('{}');
  const [moduleResult, setModuleResult] = useState<string | null>(null);

  const [reportJobId, setReportJobId] = useState('');
  const [reportResult, setReportResult] = useState<JobForgeReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const [bundleId, setBundleId] = useState('');
  const [bundleConfirm, setBundleConfirm] = useState(false);
  const [bundleResult, setBundleResult] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/admin/jobforge');
        const payload = (await response.json()) as JobForgeResponse<JobForgeStatus>;

        if (!payload.success) {
          setStatusError(payload.error.message);
          return;
        }

        setStatus(payload.data);
      } catch {
        setStatusError('Failed to load JobForge status.');
      }
    };

    loadStatus();
  }, []);

  const contextReady = useMemo(() => tenantId.length > 0 && projectId.length > 0, [
    tenantId,
    projectId,
  ]);

  const integrationReady = status.enabled && status.ready;

  const handleSubmitEvent = async () => {
    setEventResult(null);
    const parsedPayload = parseJson(eventPayload);
    if (!parsedPayload) {
      setEventResult('Invalid JSON payload.');
      return;
    }

    try {
      const response = await fetch('/api/admin/jobforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit-event',
          context: { tenantId, projectId },
          eventName,
          payload: parsedPayload,
        }),
      });
      const payload = (await response.json()) as JobForgeResponse<{ job: JobForgeJob }>;
      if (!payload.success) {
        setEventResult(payload.error.message);
        return;
      }
      setEventResult(`Event submitted. Job ID: ${payload.data.job.id}`);
    } catch {
      setEventResult('Failed to submit JobForge event.');
    }
  };

  const handleModuleDryRun = async () => {
    setModuleResult(null);
    const parsedPayload = parseJson(moduleInput);
    if (!parsedPayload) {
      setModuleResult('Invalid JSON input.');
      return;
    }

    try {
      const response = await fetch('/api/admin/jobforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-module-dry-run',
          context: { tenantId, projectId },
          moduleName,
          input: parsedPayload,
        }),
      });
      const payload = (await response.json()) as JobForgeResponse<{ job: JobForgeJob }>;
      if (!payload.success) {
        setModuleResult(payload.error.message);
        return;
      }
      setModuleResult(`Dry-run queued. Job ID: ${payload.data.job.id}`);
    } catch {
      setModuleResult('Failed to run JobForge module dry-run.');
    }
  };

  const handleViewReport = async () => {
    setReportError(null);
    setReportResult(null);

    try {
      const response = await fetch('/api/admin/jobforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view-report',
          context: { tenantId, projectId },
          jobId: reportJobId,
        }),
      });
      const payload = (await response.json()) as JobForgeResponse<JobForgeReport>;
      if (!payload.success) {
        setReportError(payload.error.message);
        return;
      }
      setReportResult(payload.data);
    } catch {
      setReportError('Failed to fetch JobForge report.');
    }
  };

  const handleBundleRequest = async () => {
    setBundleResult(null);
    if (!bundleConfirm) {
      setBundleResult('Bundle execution requires explicit confirmation.');
      return;
    }

    try {
      const response = await fetch('/api/admin/jobforge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-bundle-execution',
          context: { tenantId, projectId },
          bundleId,
          reportJobId: reportJobId || undefined,
          confirm: true,
        }),
      });
      const payload = (await response.json()) as JobForgeResponse<{ job: JobForgeJob }>;
      if (!payload.success) {
        setBundleResult(payload.error.message);
        return;
      }
      setBundleResult(`Bundle execution requested. Job ID: ${payload.data.job.id}`);
    } catch {
      setBundleResult('Failed to request bundle execution.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">JobForge Admin</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Run JobForge operations with explicit tenant and project mapping. No operations execute
          unless the integration is enabled.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Integration Status
            <Badge variant={integrationReady ? 'default' : 'secondary'}>
              {integrationReady ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {statusError && <p className="text-red-500">{statusError}</p>}
          <p>JobForge Enabled: {status.enabled ? 'Yes' : 'No'}</p>
          <p>Ready: {status.ready ? 'Yes' : 'No'}</p>
          <p>Bundle Execution Gate: {status.bundleExecutionEnabled ? 'Open' : 'Closed'}</p>
          {status.missing.length > 0 && (
            <p className="text-amber-600 dark:text-amber-300">
              Missing env: {status.missing.join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant + Project Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tenant ID
            </label>
            <Input
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              placeholder="UUID"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Project ID
            </label>
            <Input
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              placeholder="UUID"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
              placeholder="event.name"
            />
            <Textarea
              value={eventPayload}
              onChange={(event) => setEventPayload(event.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
            <Button
              onClick={handleSubmitEvent}
              disabled={!integrationReady || !contextReady || eventName.length === 0}
            >
              Submit Event
            </Button>
            {eventResult && <p className="text-sm text-slate-600 dark:text-slate-300">{eventResult}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Module (Dry Run)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={moduleName}
              onChange={(event) => setModuleName(event.target.value)}
              placeholder="module.name"
            />
            <Textarea
              value={moduleInput}
              onChange={(event) => setModuleInput(event.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
            <Button
              onClick={handleModuleDryRun}
              disabled={!integrationReady || !contextReady || moduleName.length === 0}
            >
              Run Dry-Run
            </Button>
            {moduleResult && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{moduleResult}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>View Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={reportJobId}
              onChange={(event) => setReportJobId(event.target.value)}
              placeholder="Job ID (UUID)"
            />
            <Button
              onClick={handleViewReport}
              disabled={!integrationReady || !contextReady || reportJobId.length === 0}
            >
              Fetch Report
            </Button>
            {reportError && <p className="text-sm text-red-500">{reportError}</p>}
            {reportResult && (
              <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-auto">
                {JSON.stringify(reportResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Bundle Execution (Gated)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={bundleId}
              onChange={(event) => setBundleId(event.target.value)}
              placeholder="bundle-id"
            />
            <div className="flex items-center gap-2">
              <input
                id="bundle-confirm"
                type="checkbox"
                checked={bundleConfirm}
                onChange={(event) => setBundleConfirm(event.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="bundle-confirm" className="text-sm text-slate-600 dark:text-slate-300">
                Confirm bundle execution request
              </label>
            </div>
            <Button
              onClick={handleBundleRequest}
              disabled={
                !integrationReady ||
                !contextReady ||
                bundleId.length === 0 ||
                !status.bundleExecutionEnabled
              }
              variant="destructive"
            >
              Request Execution
            </Button>
            {!status.bundleExecutionEnabled && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Bundle execution is gated by JOBFORGE_BUNDLE_EXECUTION_ENABLED.
              </p>
            )}
            {bundleResult && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{bundleResult}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
