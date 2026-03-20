import Link from "next/link";
import { notFound } from "next/navigation";
import { getExecutionLedgerEntry } from "@/lib/explorer/ledger";

export default async function ExplorerExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  const entry = await getExecutionLedgerEntry(id);
  if (!entry) notFound();

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Execution {entry.execution_id}</h1>
      <p className="text-sm text-muted-foreground">
        Tenant {entry.tenant_id} · {entry.timestamp}
      </p>
      <pre className="rounded border p-4 overflow-x-auto text-xs">
        {JSON.stringify(entry, null, 2)}
      </pre>
      <Link href={`/explorer/tenant/${entry.tenant_id}`} className="text-blue-600">
        View tenant timeline
      </Link>
    </main>
  );
}
