export default function EvidencePage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Evidence</h1>
      <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Query evidence from <code>/api/v1/runs/:id/evidence</code> using run_id, fingerprint, or
        policy hash.
      </div>
    </div>
  );
}
