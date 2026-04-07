"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Calendar, Clock, CalendarOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { safeFetch } from "@/lib/safe-fetch";
import { ScheduleConfigPanel, type ScheduleJob } from "./components";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchedulesApiResponse {
  items: ScheduleJob[];
  capability: { state: string; reason?: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jobStatusToStatusType(status: string): StatusType {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "pending";
    case "failed":
      return "failed";
    case "completed":
      return "completed";
    default:
      return "neutral";
  }
}

function describeCron(cron: string): string {
  const presets: Record<string, string> = {
    "0 * * * *": "Every hour",
    "0 */6 * * *": "Every 6 hours",
    "0 0 * * *": "Daily at midnight",
    "0 6 * * *": "Daily at 6 AM",
    "0 0 * * 1": "Weekly on Monday",
    "0 0 1 * *": "Monthly on 1st",
  };
  return presets[cron] ?? cron;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SchedulesPage() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [scheduleCapability, setScheduleCapability] = useState<SchedulesApiResponse["capability"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const result = await safeFetch<SchedulesApiResponse>("/api/console/schedules");

    if (result.success && result.data) {
      setJobs(result.data.items ?? []);
      setScheduleCapability(result.data.capability ?? null);
      setError(null);
    } else {
      setJobs([]);
      setScheduleCapability(null);
      setError(result.error?.message ?? "Failed to load schedules");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const handleRefresh = useCallback(async () => {
    await loadJobs();
  }, [loadJobs]);

  const handleSaved = useCallback(() => {
    setEditingJobId(null);
    void loadJobs();
  }, [loadJobs]);

  // Partition jobs into scheduled vs unscheduled
  const scheduledJobs = jobs.filter((j) => j.scheduleCron);
  const unscheduledJobs = jobs.filter((j) => !j.scheduleCron);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton animation="wave" className="h-8 w-48" />
          <Skeleton animation="wave" className="h-4 w-full max-w-md" />
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} animation="wave" className="h-24 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error && jobs.length === 0) {
    return (
      <div className="space-y-6">
        <ErrorState title="Failed to load schedules" message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Schedules"
          description="Store cron expressions and timezones for reconciliation jobs. Automatic execution requires a running scheduler worker and SCHEDULER_ENABLED≠false in the deployment."
          breadcrumbs={[{ label: "Console", href: "/console" }, { label: "Schedules" }]}
        />
        {scheduleCapability?.state === "degraded" && (
          <Alert variant="warning">
            <AlertTitle>Scheduler not running in this environment</AlertTitle>
            <AlertDescription>
              {scheduleCapability.reason === "scheduler_disabled_by_env"
                ? "SCHEDULER_ENABLED is false: schedules are saved as configuration only until the scheduler is enabled and a worker process is deployed."
                : "Schedule execution may be unavailable. Check deployment configuration and worker health."}
            </AlertDescription>
          </Alert>
        )}
        <EmptyState
          icon={Calendar}
          title="No reconciliation jobs"
          description="Create a reconciliation job first, then come back here to set up a recurring schedule."
          hint="Jobs can be created via the API or from the Integrations page."
          action={{ label: "View Runs", href: "/console/runs" }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const schedulerDegraded =
    scheduleCapability?.state === "degraded" && scheduleCapability.reason === "scheduler_disabled_by_env";

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Schedules"
        description="Cron and timezone configuration for jobs. Execution is automatic only when a scheduler worker is running and SCHEDULER_ENABLED is not false."
        breadcrumbs={[{ label: "Console", href: "/console" }, { label: "Schedules" }]}
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {scheduleCapability?.state === "degraded" && (
        <Alert variant="warning">
          <AlertTitle>Scheduler not running in this environment</AlertTitle>
          <AlertDescription>
            {scheduleCapability.reason === "scheduler_disabled_by_env"
              ? "SCHEDULER_ENABLED is false: cron rows are configuration only. Enable the scheduler and run the worker process to obtain automatic executions."
              : "Automatic execution may be unavailable. Validate worker deployment and SCHEDULER_ENABLED."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={scheduledJobs.length > 0 ? "info" : "outline"}>
          {scheduledJobs.length} scheduled
        </Badge>
        <Badge variant="outline">
          {unscheduledJobs.length} unscheduled
        </Badge>
      </div>

      {schedulerDegraded && (
        <Alert variant="warning" data-testid="schedules-scheduler-disabled-banner">
          <AlertTitle>Scheduler disabled in this environment</AlertTitle>
          <AlertDescription>
            Cron rows are saved, but automatic runs require{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">SCHEDULER_ENABLED</code> not set to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">false</code> on the server. Reason code:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">scheduler_disabled_by_env</code>.
          </AlertDescription>
        </Alert>
      )}

      {/* Scheduled jobs */}
      {scheduledJobs.length > 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/40 py-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>
              Jobs with saved cron expressions. Runs occur only when a scheduler worker is active and enabled in the environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {scheduledJobs.map((job) => (
              <div key={job.id}>
                <JobRow
                  job={job}
                  isEditing={editingJobId === job.id}
                  onEdit={() => setEditingJobId(editingJobId === job.id ? null : job.id)}
                  onSaved={handleSaved}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unscheduled jobs */}
      {unscheduledJobs.length > 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/40 py-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4" />
              Unscheduled Jobs
            </CardTitle>
            <CardDescription>
              Jobs without a recurring schedule. Add a schedule to persist automation intent (requires an active scheduler worker for runs).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {unscheduledJobs.map((job) => (
              <div key={job.id}>
                <JobRow
                  job={job}
                  isEditing={editingJobId === job.id}
                  onEdit={() => setEditingJobId(editingJobId === job.id ? null : job.id)}
                  onSaved={handleSaved}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobRow
// ---------------------------------------------------------------------------

interface JobRowProps {
  job: ScheduleJob;
  isEditing: boolean;
  onEdit: () => void;
  onSaved: () => void;
}

function JobRow({ job, isEditing, onEdit, onSaved }: JobRowProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/80 bg-card/50 p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-card/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground" title={job.name}>
                {job.name}
              </h3>
              <StatusBadge status={jobStatusToStatusType(job.status)} label={job.status} />
              {job.scheduleCron && (
                <Badge variant="info" size="sm">
                  {describeCron(job.scheduleCron)}
                </Badge>
              )}
              {!job.scheduleCron && (
                <Badge variant="outline" size="sm">
                  No schedule
                </Badge>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 md:grid-cols-4">
              <div>
                <span className="text-xs text-muted-foreground">Cron</span>
                <div className="font-mono text-xs text-foreground">
                  {job.scheduleCron ?? "---"}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Timezone</span>
                <div className="text-xs text-foreground">{job.scheduleTimezone}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last execution</span>
                <div className="text-xs text-foreground">
                  {job.lastExecution
                    ? new Date(job.lastExecution.startedAt).toLocaleString()
                    : "Never"}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last status</span>
                <div className="text-xs text-foreground">
                  {job.lastExecution?.status ?? "---"}
                </div>
              </div>
            </div>

            {/* Adapters */}
            <div className="text-xs text-muted-foreground">
              {[job.sourceAdapter, job.targetAdapter].filter(Boolean).join(" -> ") || "No adapters configured"}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 gap-2">
            <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={onEdit}>
              {isEditing ? "Close" : job.scheduleCron ? "Edit Schedule" : "Add Schedule"}
            </Button>
          </div>
        </div>
      </div>

      {/* Inline editor */}
      {isEditing && (
        <ScheduleConfigPanel job={job} onSaved={onSaved} />
      )}
    </div>
  );
}
