import { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quickstart - Docs",
  description:
    "Get started with Settler — run a deterministic reconciliation and inspect the evidence in under 5 minutes",
};

const demoSteps = [
  {
    title: "Clone and Install",
    description: "No database or API keys required for the demo path.",
    code: `git clone https://github.com/Hardonian/Settler.git
cd Settler
pnpm install`,
    action: null,
  },
  {
    title: "Copy Environment File",
    description: "For the demo, DATABASE_URL is not required. Leave it blank.",
    code: `cp .env.example .env
# DATABASE_URL is not needed for pnpm demo`,
    action: null,
  },
  {
    title: "Run the Demo",
    description:
      "Executes a Stripe↔QuickBooks reconciliation using fixture data. Writes four output files to examples/demo-output/.",
    code: `pnpm demo

# Expected output:
# ✓ Workflow executed deterministically
# ✓ evidence.json written
# ✓ results.json written
# ✓ report.html written`,
    action: null,
  },
  {
    title: "Inspect Results and Evidence",
    description:
      "The evidence file contains the full hash-linked audit artifact. Open report.html to browse mismatches visually.",
    code: `# Summary: matched, unmatched, and variance counts
cat examples/demo-output/results.json

# Hash-linked audit artifact for this run
cat examples/demo-output/evidence.json

# Open in browser for a visual mismatch report
open examples/demo-output/report.html`,
    action: { label: "Explore the Evidence Model", href: "/proof-explorer" },
  },
  {
    title: "Replay Verification",
    description:
      "Re-runs the reconciliation from stored artifacts and verifies the output hash matches the original. Confirms determinism.",
    code: `pnpm settler:replay examples/demo-output/evidence.json

# Expected output:
# ✓ Replay complete — hash match confirmed`,
    action: { label: "Learn about Replay", href: "/docs/api" },
  },
];

const sdkSteps = [
  {
    title: "Install the SDK",
    description: "TypeScript and Python SDKs are available.",
    code: `npm install @settler/sdk`,
    action: { label: "SDK Reference", href: "/docs/sdk" },
  },
  {
    title: "Create a Reconciliation Job",
    description:
      "Connect your data sources and define matching rules in code. Rules are version-controlled and testable.",
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
    action: { label: "Browse Integrations", href: "/docs/integrations" },
  },
  {
    title: "Run and Review Results",
    description:
      "Execute the job and inspect the mismatch report. Every run produces a verifiable evidence artifact.",
    code: `const report = await client.reports.get(job.id);

console.log("Matched:", report.summary.matched);
console.log("Unmatched:", report.summary.unmatched);

// Each mismatch includes: field, expected, actual, rule applied, evidence hash
const mismatches = await client.reconciliations.getMismatches(job.id);`,
    action: { label: "API Reference", href: "/docs/api" },
  },
];

export default function QuickstartPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Quickstart Guide</h1>

      <p className="text-lg text-slate-600 dark:text-slate-400">
        Two paths to your first result. The demo path requires no API keys and runs in under 5
        minutes. The SDK path connects to your own data sources.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>What Settler does:</strong> It matches records across your data sources, surfaces
          every variance with context, and writes a hash-linked evidence artifact you can replay and
          share. It does not make decisions — your team reviews the results.
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-6 text-slate-900 dark:text-white">
        Path A — Run the Demo (No API Key Needed)
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Runs a Stripe↔QuickBooks reconciliation using fixture data. Generates evidence you can
        inspect and replay.
      </p>

      <div className="space-y-6 my-6">
        {demoSteps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                  {index + 1}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </div>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock code={step.code} language="bash" />
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

      <h2 className="text-2xl font-bold mt-12 mb-6 text-slate-900 dark:text-white">
        Path B — Connect Your Own Data (SDK)
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Connect your own Stripe, Shopify, QuickBooks, or custom data sources using the TypeScript
        SDK.
      </p>

      <div className="space-y-6 my-6">
        {sdkSteps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-sm">
                  {index + 1}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
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
            <Link href="/architecture" className="text-blue-600 dark:text-blue-400 hover:underline">
              Architecture — full system walkthrough
            </Link>
          </li>
          <li>
            •{" "}
            <Link href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">
              API Reference — all endpoints and response shapes
            </Link>
          </li>
          <li>
            •{" "}
            <Link
              href="/docs/integrations"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Available integrations — Stripe, Shopify, QuickBooks, and more
            </Link>
          </li>
          <li>
            •{" "}
            <Link
              href="/proof-explorer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Proof Explorer — inspect evidence artifacts from your runs
            </Link>
          </li>
          <li>
            •{" "}
            <Link href="/docs/auth" className="text-blue-600 dark:text-blue-400 hover:underline">
              Authentication — API key management and scopes
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
