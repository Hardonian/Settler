import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRunDetail, getRunReplay, getRunEvidence } from "@/lib/domain/runs/runs-reader";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Activity, ShieldCheck, Database } from "lucide-react";

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.user_metadata?.tenant_id;

  if (!tenantId) {
    return <div className="p-6 text-destructive">Unauthorized: No active workspace session.</div>;
  }

  const [run, replay, evidence] = await Promise.all([
    getRunDetail(tenantId, id),
    getRunReplay(tenantId, id),
    getRunEvidence(tenantId, id),
  ]);

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Run not found</h2>
        <p className="text-muted-foreground mt-2">
          The requested reconciliation run could not be located in this workspace.
        </p>
        <Link href="/app/runs" className="mt-4 text-primary hover:underline">
          Return to Run Explorer
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "App", href: "/app" },
    { label: "Runs", href: "/app/runs" },
    { label: run.id },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "running":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Breadcrumbs items={breadcrumbItems} className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary/80" />
            Run Detail
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Detailed execution trace and reconciliation outcome for run{" "}
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{run.id}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusBadgeVariant(run.status)}
            className="px-3 py-1 text-xs uppercase tracking-wider font-bold"
          >
            {run.status_label ?? run.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(run.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Execution Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="border-b border-border/50 pb-2">
                <dt className="text-muted-foreground font-medium mb-1">Status Context</dt>
                <dd className="text-foreground flex flex-col gap-1">
                  <span>
                    State: <span className="font-semibold">{run.summary_state ?? "unknown"}</span>
                  </span>
                  <span>
                    Progress:{" "}
                    <span className="font-semibold">
                      {run.progress_state ?? "unknown"} ({run.progress_percent}%)
                    </span>
                  </span>
                </dd>
              </div>
              <div className="border-b border-border/50 pb-2">
                <dt className="text-muted-foreground font-medium mb-1">Configuration</dt>
                <dd className="text-foreground flex flex-col gap-1">
                  <span>
                    Policy: <span className="font-medium">{run.policy?.id || "default"}</span>
                  </span>
                  <span
                    className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]"
                    title={run.policy?.hash}
                  >
                    {run.policy?.hash}
                  </span>
                </dd>
              </div>
              <div className="border-b border-border/50 pb-2 sm:border-b-0">
                <dt className="text-muted-foreground font-medium mb-1">Adapter Topology</dt>
                <dd className="text-foreground flex items-center gap-2">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs">
                    {run.metadata.sourceAdapter ?? "None"}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="bg-muted px-2 py-0.5 rounded text-xs">
                    {run.metadata.targetAdapter ?? "None"}
                  </span>
                </dd>
              </div>
              <div className="pb-2">
                <dt className="text-muted-foreground font-medium mb-1">Environment</dt>
                <dd className="text-foreground">
                  Tenant: <span className="font-mono text-xs">{run.tenant_id}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Replay Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {replay ? (
              <>
                <div
                  className={
                    replay.deterministic ? "text-green-600 dark:text-green-400" : "text-destructive"
                  }
                >
                  <p className="font-semibold flex items-center gap-2">
                    {replay.deterministic ? "✓ Hash Matched" : "⚠ Drift Detected"}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground/80 leading-relaxed">
                    Deterministic replay{" "}
                    {replay.deterministic ? "confirmed the integrity" : "flagged a shift"} in
                    processing logic compared to baseline.
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                      Baseline Hash
                    </span>
                    <span className="font-mono text-[10px] bg-muted/50 p-1 rounded truncate">
                      {String(replay.diff?.originalFingerprint || "N/A")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                      Replay Hash
                    </span>
                    <span className="font-mono text-[10px] bg-muted/50 p-1 rounded truncate">
                      {String(replay.diff?.replayFingerprint || "N/A")}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Replay summary unavailable for this run. Run might be too old or replay lab was not
                enabled during execution.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Evidence and Lineage Context
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {evidence ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  Lineage Run ID
                </span>
                <p className="text-sm font-mono truncate bg-muted/20 p-1.5 rounded border border-border/30">
                  {evidence.run_id ?? run.id}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  Cryptographic Fingerprint
                </span>
                <p className="text-sm font-mono truncate bg-muted/20 p-1.5 rounded border border-border/30">
                  {typeof run.fingerprint === "string" ? run.fingerprint : "None"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                  Artifact Lineage Path
                </span>
                <p className="text-sm text-muted-foreground truncate">
                  {String(evidence.evidence.artifact_path)}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 border-2 border-dashed border-border/40 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Detailed evidence and proof chain unavailable for this run.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/50 pt-6">
            <Link
              href={`/app/proofs/${run.id}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Open Truth Explorer for this run
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href={`/app/replay?runId=${run.id}`}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Replay this run in Lab
            </Link>
            <Link
              href="/app/alerts"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto mr-4"
            >
              Open Live Alerts
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
