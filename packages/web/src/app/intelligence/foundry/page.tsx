import Link from "next/link";
import { getFoundryDatasets, getFoundryRuns } from "@/lib/foundry/store";

export const dynamic = "force-dynamic";

export default function FoundryPage(): JSX.Element {
  const datasets = getFoundryDatasets();
  const runs = getFoundryRuns();

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Test Data Foundry</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Dataset</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Items</th>
            <th className="text-left p-2">Last Run</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => {
            const latest = runs.filter((run) => run.dataset_id === dataset.dataset_id).slice(-1)[0];
            return (
              <tr key={dataset.dataset_id} className="border-b">
                <td className="p-2">
                  <Link className="underline" href={`/intelligence/foundry/${dataset.dataset_id}`}>
                    {dataset.name}
                  </Link>
                </td>
                <td className="p-2">{dataset.dataset_type}</td>
                <td className="p-2">{dataset.items_count}</td>
                <td className="p-2">{latest?.finished_at ?? "—"}</td>
              </tr>
            );
          })}
          {datasets.length === 0 && (
            <tr>
              <td colSpan={4} className="p-2 text-gray-500">
                No datasets yet. Run `settler foundry bootstrap`.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
