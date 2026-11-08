import RoleMatrix from "@/components/RoleMatrix";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";
import FreezeToggle from "@/components/FreezeToggle";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, History, ArrowRight } from "lucide-react";
import { getPoliciesList, getAuditLogs } from "@/lib/domain/runs/runs-reader";
import Link from "next/link";

export default async function GovernancePage() {
  const [policies, auditLogs] = await Promise.all([getPoliciesList(20), getAuditLogs(8)]);

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Governance & Compliance"
        title="Governance"
        description="Manage policy versions, role boundaries, and operational freeze controls for this workspace."
        icon={ShieldCheck}
        variant="hero"
      />

      {/* Controls */}
      <div className="space-y-4">
        <div className="panel p-6">
          <FreezeToggle />
        </div>
        <div className="panel p-6">
          <RoleMatrix />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
          <PolicyViewer initialPolicies={policies} />
        </div>
      </div>

      {/* Recent Mutations Timeline */}
      <Card className="panel shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" aria-hidden="true" />
              Recent Governance & Audit Events
            </CardTitle>
            <Link
              href="/console/audits"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Full Audit Ledger
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {auditLogs.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
              No governance mutations recorded yet for this workspace. Visit{" "}
              <Link href="/console/audits" className="font-semibold text-primary hover:underline">
                /console/audits
              </Link>{" "}
              for full audit inspection.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" size="sm" className="font-mono uppercase shrink-0">
                      {log.action}
                    </Badge>
                    <span className="text-foreground font-medium truncate">{log.details}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono shrink-0">
                    <span>{log.actor}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
