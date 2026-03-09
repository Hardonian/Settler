import Link from "next/link";
import { listExecutionLedgerEntries } from "@/lib/explorer/ledger";

export default async function ExplorerTenantPage({
  params,
}: {
  params: Promise<{ tenant_id: string }>;
}) {
  const { tenant_id } = await params;
  const entries = await listExecutionLedgerEntries({ tenantId: tenant_id, limit: 100 });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tenant execution timeline</h1>
      <p className="text-sm text-slate-500">{tenant_id}</p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.execution_id} className="rounded border p-3 text-sm">
            <Link
              href={`/explorer/execution/${entry.execution_id}`}
              className="font-medium text-blue-600"
            >
              {entry.execution_id}
            </Link>
            <div className="text-slate-500">
              {entry.status} · {entry.duration}ms · {entry.policy_version}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
