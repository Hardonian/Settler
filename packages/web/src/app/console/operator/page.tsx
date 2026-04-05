import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Operator | Settler Console",
  description: "Evidence-backed operator surfaces — no synthetic fleet health.",
};

export default function OperatorPage() {
  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">Operator</p>
        <h1 className="text-3xl font-semibold tracking-tight">Console operator hub</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This route previously showed illustrative fleet metrics. Those are removed: Settler does not
          ship synthetic multi-region orchestration truth in the product console. Use the surfaces
          below, which fail closed or cite query-backed evidence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operator digest</CardTitle>
            <CardDescription>
              Workspaces needing attention, run failures, exception depth, proof gaps, and plan limit
              context from the canonical commercial spine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/console/operator-digest"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open digest →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidents</CardTitle>
            <CardDescription>Tenant-scoped incident list when configured.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/operator/incidents" className="text-sm font-medium text-primary hover:underline">
              Open incidents →
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground/70">
        Platform-wide control-plane analytics (admin-only) remain on{" "}
        <code className="text-[10px]">GET /api/console/operator/control-plane</code> — not mirrored
        here as end-user fleet health.
      </p>
    </div>
  );
}
