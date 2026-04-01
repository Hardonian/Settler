import { redirect } from "next/navigation";

/**
 * Canonical run detail redirect.
 *
 * The `/app/runs/[id]` route previously rendered a thin, SSR-only run detail view
 * that duplicated (and fell behind) the canonical operator run detail surface at
 * `/console/runs/[runId]`.
 *
 * Rather than maintaining two run detail views with diverging data contracts,
 * this page now redirects to the canonical console run detail, which provides:
 *
 *  - Full exception workflow (counts, links to filtered exception queues)
 *  - Result provenance with prior-run comparison deltas
 *  - Config drift detection and snapshot-backed configuration context
 *  - Stage pipeline visualization
 *  - Summary semantics (processed, exceptioned, unresolved, resolved, tolerance)
 *  - Run kind discrimination (recon_job vs ingestion_run)
 *  - Live polling for non-terminal runs
 *  - Governance freeze awareness
 *
 * Keeping a single canonical detail surface prevents operator trust dilution
 * and ensures backend contract evolution is reflected in one place.
 */
export default async function RunDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/console/runs/${id}`);
}
