/**
 * Jobs Admin Page
 *
 * Admin view for monitoring job queue status across the system.
 * Allows viewing job status, results, and basic queue metrics.
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { redirect } from "next/navigation";
import { listJobs, JobStatus } from "@/lib/jobs";
import { formatDistanceToNow } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Status icon mapping
const statusIcons: Record<JobStatus, React.ReactNode> = {
  queued: <Clock className="w-4 h-4 text-blue-500" />,
  running: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />,
  succeeded: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  dead: <AlertCircle className="w-4 h-4 text-slate-500" />,
  canceled: <XCircle className="w-4 h-4 text-slate-400" />,
};

// Status color mapping
const statusColors: Record<JobStatus, string> = {
  queued: "bg-blue-50 text-blue-700 border-blue-200",
  running: "bg-yellow-50 text-yellow-700 border-yellow-200",
  succeeded: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  dead: "bg-slate-50 text-slate-700 border-slate-200",
  canceled: "bg-slate-50 text-slate-600 border-slate-200",
};

interface JobsAdminPageProps {
  searchParams: Promise<{ tenant_id?: string; status?: JobStatus; page?: string }>;
}

async function JobsAdminContent({ searchParams }: JobsAdminPageProps) {
  const params = await searchParams;
  const tenantId = params.tenant_id;
  const statusFilter = params.status;
  const page = parseInt(params.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Check admin access
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/console");
  }

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs Monitor</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor job queue status and view job details. Select a tenant to view their jobs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Tenant</CardTitle>
            <CardDescription>Choose a tenant to view their job queue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please provide a tenant_id query parameter to view jobs for a specific tenant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch jobs for the tenant
  const result = await listJobs({
    tenantId,
    status: statusFilter,
    limit,
    offset,
  });

  if ("error" in result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs Monitor</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { jobs, total, hasMore } = result;

  // Calculate stats
  const stats = {
    total,
    queued: jobs.filter((j) => j.status === "queued").length,
    running: jobs.filter((j) => j.status === "running").length,
    succeeded: jobs.filter((j) => j.status === "succeeded").length,
    failed: jobs.filter((j) => j.status === "failed" || j.status === "dead").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs Monitor</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Tenant: <code className="text-sm bg-slate-100 px-2 py-1 rounded">{tenantId}</code>
            {statusFilter && (
              <span className="ml-2">
                • Filter: <span className="font-medium">{statusFilter}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/console/admin/activation">Back to Admin</Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Queued</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.queued}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.running}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Succeeded</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.succeeded}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed/Dead</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Links */}
      <div className="flex flex-wrap gap-2">
        <Button variant={!statusFilter ? "default" : "outline"} size="sm" asChild>
          <Link href={`/console/admin/jobs?tenant_id=${tenantId}`}>All</Link>
        </Button>
        {(["queued", "running", "succeeded", "failed", "dead"] as JobStatus[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/console/admin/jobs?tenant_id=${tenantId}&status=${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Link>
          </Button>
        ))}
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            Showing {jobs.length} of {total} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No jobs found{statusFilter ? ` with status "${statusFilter}"` : ""}.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${statusColors[job.status as JobStatus]}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {statusIcons[job.status as JobStatus]}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono truncate">{job.id.slice(0, 8)}...</code>
                        <span className="text-sm font-medium">{job.type}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[job.status as JobStatus]}`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {job.attempts}/{job.max_attempts} attempts
                        {job.created_at && (
                          <span className="ml-2">
                            • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/console/admin/jobs/${job.id}?tenant_id=${tenantId}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild>
                <Link
                  href={`/console/admin/jobs?tenant_id=${tenantId}${statusFilter ? `&status=${statusFilter}` : ""}&page=${page - 1}`}
                >
                  Previous
                </Link>
              </Button>
              <span className="text-sm text-slate-600">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button variant="outline" size="sm" disabled={!hasMore} asChild>
                <Link
                  href={`/console/admin/jobs?tenant_id=${tenantId}${statusFilter ? `&status=${statusFilter}` : ""}&page=${page + 1}`}
                >
                  Next
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graceful Degradation Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            Jobs remain in &quot;queued&quot; status until processed by a worker. If the worker is
            offline, jobs will stay queued until it comes back online. Processing may take longer
            during high load periods.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobsAdminPage({ searchParams }: JobsAdminPageProps) {
  return (
    <ErrorBoundary context="Jobs Admin">
      <Suspense fallback={<PageLoadingSkeleton />}>
        <JobsAdminContent searchParams={searchParams} />
      </Suspense>
    </ErrorBoundary>
  );
}
