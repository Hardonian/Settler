import Link from "next/link";

export default async function ProofDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Proof Receipt {id}</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Cross-system provenance and artifact lineage for this proof are available in Proof Explorer.
      </p>
      <Link href="/app/proofs" className="text-blue-600 underline">
        Open proof explorer
      </Link>
    </main>
  );
}
