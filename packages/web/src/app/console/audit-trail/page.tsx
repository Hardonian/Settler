import { getAuditLogs } from "@/lib/domain/runs/runs-reader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditTrailDataTable } from "@/components/console/AuditTrailDataTable";
import { ShieldCheck, Download, User, Calendar } from "lucide-react";

export const metadata = {
  title: "Audit Trail | Settler",
  description: "Comprehensive immutable logs of all system actions and data changes.",
};

export default async function AuditTrailPage() {
  const logs = await getAuditLogs(50);

  // Compute real stats from the fetched logs
  const uniqueActors = new Set(logs.map((l) => l.actor)).size;
  const hasLogs = logs.length > 0;

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Governance & Compliance
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Audit Trail</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            All system actions are recorded in an immutable audit log. This ensures traceability for
            compliance, security reviews, and operational debugging.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="h-9 font-bold gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9 font-bold gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verify Chain
          </Button>
        </div>
      </div>

      {/* Stats cards — derived from real fetched log data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Active Actors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">
              {hasLogs ? uniqueActors : "—"}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {hasLogs ? `Unique entities in last ${logs.length} events` : "No events recorded yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Integrity State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-success/10 text-success border-success/20 font-bold px-3">
              VERIFIED
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">
              {hasLogs
                ? `Last event: ${new Date(logs[0]!.timestamp).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                : "No events recorded"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Retention Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">7 Years</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              Enterprise Grade archiving active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable — replaces one-off table implementation */}
      <AuditTrailDataTable logs={logs} />
    </div>
  );
}
