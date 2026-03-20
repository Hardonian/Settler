import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UsageLimitIndicator } from "@/components/UsageLimitIndicator";
import {
  BarChart3,
  Zap,
  CreditCard,
  ArrowUpRight,
  Database,
  Globe,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Usage & Billing | Settler",
  description: "Monitor your reconciliation volume, resource consumption, and plan limits.",
};

export default function UsagePage() {
  // Real-world dashboard pattern for usage
  const quota = {
    reconciliations: { current: 12540, limit: 100000 },
    storage: { current: 4.2, limit: 50 }, // GB
    retention: { current: 30, limit: 30 }, // Days
    compute: { current: 840, limit: 2000 }, // CPU Hours
  };

  const plan = {
    name: "Commercial",
    status: "active",
    nextBilling: "April 15, 2026",
    amount: "$99.00/mo",
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Operations & Billing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Usage Control</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Monitor infrastructure consumption and manage your resource allocation. Usage metrics
            are tracked in real-time to ensure predictable performance across your reconciliation
            pipelines.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 font-bold gap-2 shadow-xl ring-1 ring-primary/20">
          <Link href="/pricing" className="flex items-center gap-2">
            Upgrade Resources
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Consumption Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 overflow-hidden glass">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Consumption Metrics
              </CardTitle>
              <CardDescription className="font-medium mt-1">
                Resource utilization across the current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Monthly Reconciliations</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Volume processed through the engine
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">12,540</span>
                    <span className="text-xs text-muted-foreground font-medium ml-2">/ 100k</span>
                  </div>
                </div>
                <Progress value={12.5} className="h-2" />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Evidence Snapshot Storage</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Merkle-tree proofs and raw ingestion buffers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">4.2 GB</span>
                    <span className="text-xs text-muted-foreground font-medium ml-2">/ 50 GB</span>
                  </div>
                </div>
                <Progress value={8.4} className="h-2" />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">API Egress Traffic</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        External Webhook and Result payload delivery
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono">148 MB</span>
                    <span className="text-xs text-muted-foreground font-medium ml-2">/ 10 GB</span>
                  </div>
                </div>
                <Progress value={1.5} className="h-2" />
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                <Clock className="h-3 w-3" />
                Last synchronized: March 20, 2026 02:45 UTC
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                  Active Policy Count
                </CardDescription>
                <CardTitle className="text-2xl font-mono">
                  4 <span className="text-muted-foreground text-sm">/ 10</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[40%]" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                  Historical Replays
                </CardDescription>
                <CardTitle className="text-2xl font-mono">
                  82 <span className="text-muted-foreground text-sm">/ 500</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[16.4%]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan & Billing Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
            <div className="absolute -right-8 -top-8 p-4 opacity-10">
              <CreditCard className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Plan Details
              </CardTitle>
              <CardDescription className="font-bold text-primary italic underline underline-offset-4">
                {plan.name} License
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Next Billing Cycle
                </p>
                <p className="text-sm font-bold text-foreground">{plan.nextBilling}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Estimated Amount
                </p>
                <p className="text-xl font-bold text-foreground font-mono">{plan.amount}</p>
              </div>

              <div className="pt-6 border-t border-primary/20 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    High-Priority Reconciliation Queue
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    SSO & Multi-Tenant Support
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Automated Evidence Signing
                  </span>
                </div>
              </div>

              <Button variant="default" className="w-full h-11 font-bold shadow-lg">
                Manage Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Limits & Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              <UsageLimitIndicator
                current={quota.reconciliations.current}
                limit={quota.reconciliations.limit}
                type="reconciliations"
                userPlan="commercial"
              />

              <div className="mt-8 pt-8 border-t border-border/40 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Recent Invoices
                  </h4>
                  <Link
                    href="/console/billing/history"
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "INV-621", date: "Mar 01, 2026", amount: "$99.00", status: "Paid" },
                    { id: "INV-584", date: "Feb 01, 2026", amount: "$99.00", status: "Paid" },
                  ].map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/40 group hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                          {inv.id}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {inv.date}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-foreground">{inv.amount}</p>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase text-success border-success/30 bg-success/5 h-4"
                        >
                          PAID
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
