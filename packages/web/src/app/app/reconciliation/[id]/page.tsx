import Link from "next/link";

export default async function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Reconciliation {id}</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Detailed reconciliation drilldown is loading from unified adapters.
      </p>
      <Link href="/app/reconciliation" className="text-blue-600 underline">
        Back to reconciliation list
      </Link>
    </main>
  );
}
