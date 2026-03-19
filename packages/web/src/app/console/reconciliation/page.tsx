import { redirect } from "next/navigation";

export default async function ReconciliationRouteAlias({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string }>;
}) {
  const params = await searchParams;
  const runId = params.runId;

  if (runId) {
    redirect(`/console/reconciliations?runId=${encodeURIComponent(runId)}`);
  }

  redirect("/console/reconciliations");
}
