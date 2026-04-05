import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Headphones, LayoutDashboard, Shield } from "lucide-react";

export const metadata = {
  title: "Operator Console | Settler",
  description:
    "Honest operator routing: tenant workbench, diagnostics, and admin-only ops surfaces — no synthetic fleet telemetry.",
};

export default function OperatorPage() {
  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Solo-operator routing
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Operator console</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This route is a control-plane index. It does not render live multi-region fleet health,
          fabricated latencies, or storage efficiency — those were removed because they were not
          backed by repository contracts. Use the links below for real surfaces.
        </p>
      </div>

      <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" aria-hidden="true" />
        <AlertTitle>No synthetic health theatre</AlertTitle>
        <AlertDescription>
          Tenant-scoped run and exception truth lives in the workbench and run detail routes.
          Super-admin fleet views live under Ops and Support inbox — both require elevated role.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">Tenant command center</CardTitle>
            </div>
            <CardDescription>Open exceptions, runs, and activation readiness for the current scope.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/console">Open workbench</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">Diagnostics</CardTitle>
            </div>
            <CardDescription>Explicit missing-env and contract disclosure for this deployment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/console/diagnostics">Open diagnostics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">Ops command center</CardTitle>
            </div>
            <CardDescription>Super-admin monitoring and management (gated).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/console/ops">Open ops</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">Support inbox</CardTitle>
            </div>
            <CardDescription>Evidence-oriented intake queue for elevated operators.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/console/support">Open support inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
