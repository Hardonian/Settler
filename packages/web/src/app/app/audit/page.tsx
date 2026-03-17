import SecurityOverview from "@/components/stitch-import/SecurityOverview";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Governance
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Audit Surfaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Security posture, access audit trails, and evidence-facing system surfaces for compliance
          review and governance oversight.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <SecurityOverview />
      </div>
    </div>
  );
}
