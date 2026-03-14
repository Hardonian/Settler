import SecurityOverview from "@/components/stitch-import/SecurityOverview";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Governance</p>
        <h1 className="text-2xl font-semibold">Audit Surfaces</h1>
        <p className="mt-1 text-sm text-slate-600">
          Security posture, access audit trails, and evidence-facing system surfaces for compliance
          review and governance oversight.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <SecurityOverview />
      </div>
    </div>
  );
}
