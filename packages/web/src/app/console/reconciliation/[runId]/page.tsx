import { redirect } from "next/navigation";

export default async function ReconciliationRunAlias({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  redirect(`/console/reconciliations?runId=${encodeURIComponent(runId)}`);
}
