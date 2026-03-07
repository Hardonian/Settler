import Link from "next/link";

export const metadata = {
  title: "Deterministic Replay Lab",
  description: "Inspect replay timelines with expected-vs-observed hash diffs.",
};

export default function ReplayLabPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-4">
      <h1 className="text-3xl font-semibold">Deterministic Replay Lab</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Validate determinism with timeline replay and drift checks from real execution receipts.
      </p>
      <Link href="/app/replay" className="text-blue-600 underline">
        Open control-plane replay surface
      </Link>
    </main>
  );
}
