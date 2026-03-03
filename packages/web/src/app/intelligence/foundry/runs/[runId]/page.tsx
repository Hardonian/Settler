import { getFoundryRuns } from "@/lib/foundry/store";

export const dynamic = "force-dynamic";

export default async function FoundryRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}): Promise<JSX.Element> {
  const { runId } = await params;
  const run = getFoundryRuns().find((entry) => entry.dataset_run_id === runId);

  if (!run) {
    return <main className="p-8">Run not found.</main>;
  }

  return (
    <main className="p-8 space-y-3">
      <h1 className="text-2xl font-semibold">Foundry Run {run.dataset_run_id}</h1>
      <p>Dataset: {run.dataset_id}</p>
      <p>Started: {run.started_at}</p>
      <p>Finished: {run.finished_at}</p>
      <p>Pass: {run.summary.pass_count}</p>
      <p>Fail: {run.summary.fail_count}</p>
    </main>
  );
}
