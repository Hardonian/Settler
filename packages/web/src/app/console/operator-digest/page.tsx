import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOperatorDigest } from "@/lib/server/console/operator-digest";

export const metadata = {
  title: "Operator digest | Settler Console",
  description: "Evidence-backed overview of workspaces, activation gaps, and exception load.",
};

function severityVariant(s: "attention" | "degraded" | "info") {
  if (s === "degraded") return "destructive" as const;
  if (s === "attention") return "warning" as const;
  return "secondary" as const;
}

export default async function OperatorDigestPage() {
  const digest = await getOperatorDigest();

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Solo operator oversight
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Operator digest</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This page only surfaces issues backed by database or Supabase rows we could read. It does
          not claim fleet health, synthetic uptime, or revenue truth beyond explicit plan limits from
          the commercial spine.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Generated {new Date(digest.generatedAt).toLocaleString()}
          {digest.degraded && digest.degradedReason ? (
            <span className="ml-2 text-destructive">· degraded: {digest.degradedReason}</span>
          ) : null}
        </p>
      </div>

      {digest.billing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan limits (canonical spine)</CardTitle>
            <CardDescription>{digest.billing.note}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Plan:</span>{" "}
              <span className="font-medium">{digest.billing.planName}</span>{" "}
              <span className="font-mono text-xs">({digest.billing.planCode})</span>
            </p>
            <p>
              <span className="text-muted-foreground">Included reconciliations / month:</span>{" "}
              {digest.billing.reconciliationLimit ?? "custom / not applicable"}
            </p>
            <p>
              <span className="text-muted-foreground">Approx. included exceptions (at full volume):</span>{" "}
              {digest.billing.exceptionIncludedApprox ?? "n/a"}
            </p>
            <Link href="/pricing" className="text-xs text-primary hover:underline inline-block mt-2">
              Public pricing
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attention items</CardTitle>
          <CardDescription>
            Sorted with degraded signals first. Empty list means no structured blockers were found,
            not that production is certified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {digest.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No digest rows for this session.</p>
          ) : (
            digest.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 p-4 space-y-2 bg-card/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <Link href={item.href} className="text-primary hover:underline">
                    Open related surface
                  </Link>
                  {Object.keys(item.evidence).length > 0 && (
                    <span className="font-mono text-muted-foreground/80">
                      {JSON.stringify(item.evidence)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground/60">
        For cross-run exception families and adjudication-backed ranking, use{" "}
        <Link href="/app/console/intelligence" className="text-primary hover:underline">
          Reconciliation Intelligence
        </Link>{" "}
        (Exception Intelligence Pack / active subscription).
      </p>
    </div>
  );
}
