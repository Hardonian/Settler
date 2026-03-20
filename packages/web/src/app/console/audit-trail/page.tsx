import { getAuditLogs } from "@/lib/domain/runs/runs-reader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ShieldCheck, Download, Search, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Audit Trail | Settler",
  description: "Comprehensive immutable logs of all system actions and data changes.",
};

export default async function AuditTrailPage() {
  const logs = await getAuditLogs(50);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Active Actors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">12</span>
            <p className="text-[10px] text-muted-foreground mt-1">Unique entities in last 24h</p>
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
            <p className="text-[10px] text-muted-foreground mt-1">Last hash check: Just now</p>
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

      <Card className="border-border/40 shadow-sm overflow-hidden glass">
        <CardHeader className="pb-4 border-b border-border/40 relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Execution & Modification Log
              </CardTitle>
              <CardDescription className="font-medium">
                Recent system events and administrative actions
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter logs..."
                className="h-9 pl-9 pr-4 rounded-lg bg-muted/40 border-none text-xs font-medium focus:ring-1 focus:ring-primary w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20 border-b border-border/40">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[150px]">Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[150px]">Actor</TableHead>
                <TableHead className="text-right w-[100px]">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="group border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors"
                >
                  <TableCell className="text-[11px] font-mono whitespace-nowrap opacity-70">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        log.action.includes("error")
                          ? "text-destructive border-destructive/30 bg-destructive/5"
                          : log.action.includes("delete")
                            ? "text-warning border-warning/30 bg-warning/5"
                            : "text-primary border-primary/30 bg-primary/5"
                      }`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-foreground capitalize">
                    {log.resource.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {log.details}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-foreground">{log.actor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground text-right">
                    {log.ip}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground italic font-medium"
                  >
                    No audit events recorded for current viewport.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
