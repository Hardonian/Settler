import Link from "next/link";
import { getFoundryDatasets, getFoundryRuns } from "@/lib/foundry/store";

export const dynamic = "force-dynamic";

export default async function FoundryDatasetPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}): Promise<JSX.Element> {
  const { datasetId } = await params;
  const dataset = getFoundryDatasets().find((entry) => entry.dataset_id === datasetId);
  const runs = getFoundryRuns(datasetId);

  if (!dataset) {
    return <main className="p-8">Dataset not found.</main>;
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{dataset.name}</h1>
      <p className="text-sm text-gray-500">
        {dataset.dataset_type} · {dataset.items_count} items
      </p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Run</th>
            <th className="text-left p-2">Started</th>
            <th className="text-left p-2">Finished</th>
            <th className="text-left p-2">Pass/Fail</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr className="border-b" key={run.dataset_run_id}>
              <td className="p-2">
                <Link
                  className="underline"
                  href={`/intelligence/foundry/runs/${run.dataset_run_id}`}
                >
                  {run.dataset_run_id}
                </Link>
              </td>
              <td className="p-2">{run.started_at}</td>
              <td className="p-2">{run.finished_at}</td>
              <td className="p-2">
                {run.summary.pass_count}/{run.summary.fail_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
