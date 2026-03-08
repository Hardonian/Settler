import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started - Docs",
  description: "Install Settler, run your first reconciliation, and verify the evidence output.",
};

export default function GettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-6">Getting Started</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Settler is a deterministic reconciliation engine. You define matching rules in code, run
          reconciliation via API or CLI, and get back mismatches with a SHA-256 evidence hash. This
          guide covers two paths: the local OSS path (no signup required) and the hosted API path.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Path A — Local / Self-hosted (fastest first run)
            </h2>
            <ol className="list-decimal list-outside ml-5 space-y-3">
              <li>
                Clone and install:
                <code className="block mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                  git clone https://github.com/Hardonian/Settler.git && cd Settler && pnpm install
                </code>
              </li>
              <li>
                Copy environment defaults:
                <code className="block mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                  cp .env.example .env
                </code>
                (No <code>DATABASE_URL</code> required for the demo workflow.)
              </li>
              <li>
                Run the deterministic demo:
                <code className="block mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                  pnpm demo
                </code>
                This generates <code>examples/demo-output/results.json</code> and{" "}
                <code>evidence.json</code>.
              </li>
              <li>
                Verify determinism via replay:
                <code className="block mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-sm font-mono">
                  pnpm settler:replay examples/demo-output/evidence.json
                </code>
                The CLI re-runs the workflow and confirms the SHA-256 hash matches.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Path B — Hosted API</h2>
            <ol className="list-decimal list-outside ml-5 space-y-3">
              <li>
                <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Create an account
                </Link>{" "}
                and generate an API key from{" "}
                <Link
                  href="/app/console/api-keys"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  the console
                </Link>
                .
              </li>
              <li>
                Install the SDK:{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm font-mono">
                  npm install @settler/sdk
                </code>
              </li>
              <li>
                <Link
                  href="/docs/quickstart"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Follow the Quickstart guide
                </Link>{" "}
                to create a job, run reconciliation, and review the evidence output.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What you get after first run</h2>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                A <code>results.json</code> with matched and unmatched record summaries
              </li>
              <li>
                An <code>evidence.json</code> with the full execution record and SHA-256 hash
              </li>
              <li>
                A human-reviewable variance list — no automated decisions, you resolve each item
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Explore further</h2>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <Link href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">
                  API Reference
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/integrations"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Available adapters and integrations
                </Link>
              </li>
              <li>
                <Link href="/docs/sdk" className="text-blue-600 dark:text-blue-400 hover:underline">
                  SDK documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/replay-lab"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Replay Lab — verify determinism on any past run
                </Link>
              </li>
              <li>
                <Link
                  href="/proof-explorer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Proof Explorer — inspect evidence artifacts
                </Link>
              </li>
              <li>
                <Link
                  href="/security-and-audit"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Security architecture
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
