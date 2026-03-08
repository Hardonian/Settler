import { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quickstart - Docs",
  description:
    "Get started with Settler — reconcile financial data, find mismatches, and verify results",
};

const steps = [
  {
    title: "Install and configure",
    description:
      "Install the SDK and set your API key. Get a key from the console or use the local CLI for development.",
    code: `npm install @settler/sdk

# Set your API key — get one at /app/console/api-keys
export SETTLER_API_KEY=sk_your_key_here`,
    action: { label: "Get an API key", href: "/app/console/api-keys" },
  },
  {
    title: "Create a reconciliation job",
    description:
      "Define your data sources and explicit matching rules. Rules are plain objects — version them, test them, review them in PRs.",
    code: `import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await client.jobs.create({
  name: "Stripe → Shopify Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "shopify",
    config: { apiKey: process.env.SHOPIFY_API_KEY },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});

console.log("Job created:", job.id);`,
    action: { label: "Browse integrations", href: "/docs/integrations" },
  },
  {
    title: "Run and check status",
    description:
      "Execute the job and poll for completion. The engine is deterministic — the same data and rules produce identical results.",
    code: `// Run the job
const run = await client.jobs.run(job.id);

// Poll until complete (or use webhooks)
const status = await client.jobs.get(job.id);
console.log("Status:", status.status); // "completed" | "failed" | "running"`,
    action: { label: "Webhook docs", href: "/docs/webhooks" },
  },
  {
    title: "Review evidence and mismatches",
    description:
      "Get the report with matched records, unmatched variances, and the SHA-256 evidence hash. Your team resolves flagged items.",
    code: `const report = await client.reports.get(job.id);

console.log("Matched:", report.summary.matched);
console.log("Unmatched:", report.summary.unmatched);

// Evidence hash — verifies the report has not been altered
console.log("Evidence SHA-256:", report.evidence.sha256);

// To replay this run and confirm determinism:
// settler replay --run-id <run-id>`,
    action: { label: "View API reference", href: "/docs/api" },
  },
];

export default function QuickstartPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Quickstart Guide</h1>

      <p className="text-lg text-slate-600 dark:text-slate-400">
        Install the SDK, define rules, run reconciliation, and review the evidence-backed results.
        You can run a full reconciliation locally in under ten minutes.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>What Settler does:</strong> It matches records across data sources, surfaces every
          variance with full context, and produces a SHA-256 evidence hash for each run. Your team
          reviews and resolves flagged items. Settler does not make decisions or automate judgment.
        </p>
      </div>

      <div className="space-y-8 my-8">
        {steps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  {index + 1}
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </div>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock code={step.code} language="typescript" />
              {step.action && (
                <Button variant="outline" asChild>
                  <Link href={step.action.href}>
                    {step.action.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 my-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Next Steps
        </h2>
        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
          <li>
            •{" "}
            <Link href="/replay-lab" className="text-blue-600 dark:text-blue-400 hover:underline">
              Replay Lab
            </Link>{" "}
            — re-run any past job and verify determinism via hash comparison
          </li>
          <li>
            •{" "}
            <Link
              href="/proof-explorer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Proof Explorer
            </Link>{" "}
            — inspect evidence artifacts and artifact lineage
          </li>
          <li>
            •{" "}
            <Link href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">
              API Reference
            </Link>{" "}
            — full endpoint documentation
          </li>
          <li>
            •{" "}
            <Link
              href="/docs/integrations"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Integrations
            </Link>{" "}
            — available adapters and building custom ones
          </li>
          <li>
            •{" "}
            <Link href="/docs/auth" className="text-blue-600 dark:text-blue-400 hover:underline">
              Auth &amp; Security
            </Link>{" "}
            — API keys, tenant isolation, and access controls
          </li>
          <li>
            •{" "}
            <Link
              href="/security-and-audit"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Security architecture
            </Link>{" "}
            — how the evidence model and audit trail work
          </li>
        </ul>
      </div>
    </div>
  );
}
