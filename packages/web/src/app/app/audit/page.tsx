import { getAuditLogs, AuditLogItem } from "@/lib/domain/runs/runs-reader";
import SecurityOverview from "@/components/stitch-import/SecurityOverview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { History, User, Shield, Database, Globe, MoreHorizontal } from "lucide-react";

export const metadata = {
  title: "Audit Surfaces | Settler",
  description: "Immutable audit trails, security posture, and compliance evidence.",
};

const getActionBadge = (action: string) => {
  switch (action.toLowerCase()) {
    case "create":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">CREATE</Badge>
      );
    case "update":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">UPDATE</Badge>;
    case "delete":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">DELETE</Badge>
      );
    default:
      return <Badge variant="outline">{action.toUpperCase()}</Badge>;
  }
};

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-12 pb-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Governance & Assurance
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Audit Surfaces</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          The immutable ledger of all workspace activities. Audit trails track mutations across
          policies, data connections, and reconciliation runs to maintain a verifiable chain of
          custody.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            Immutable Activity Trail
          </h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            {logs.length} ENTRIES
          </Badge>
        </div>

        <div className="space-y-3">
          {logs.map((log: AuditLogItem) => (
            <Card
              key={log.id}
              className="group overflow-hidden border-border/40 shadow-none hover:bg-muted/10 transition-all border-l-2 border-l-transparent hover:border-l-primary/40"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      {log.actor === "system" ? (
                        <Database className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        {getActionBadge(log.action)}
                        <span className="text-sm font-bold text-foreground">
                          {log.resource.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">
                          ID: {log.resourceId?.slice(0, 8) || "N/A"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate italic">{log.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div className="hidden md:block">
                      <div className="flex items-center gap-1.5 justify-end mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Globe className="h-3 w-3" />
                        {log.ip}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      title="Audit Details"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {logs.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/20">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-base font-bold text-foreground">Clean Audit Ledger</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                No auditable actions have been recorded in this workspace environment yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="pt-8 border-t border-border/40">
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Posture
          </h2>
        </div>
        <SecurityOverview />
      </section>
    </div>
  );
}
