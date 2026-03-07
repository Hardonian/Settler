import { Metadata } from "next";
import Image from "next/image";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/SafeImage";
import { Rocket, Code, Zap, Shield } from "lucide-react";
import { TrackedLink } from "@/components/analytics/TrackedLink";

export const metadata: Metadata = {
  title: "Documentation - Settler",
  description:
    "Docs for Settler, the Open Source Reconciliation Engine: run workflows, detect mismatches, replay runs, and export evidence.",
};

export default function DocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Open Source Reconciliation Engine Docs</h1>

      <p className="text-lg text-slate-600 dark:text-slate-400">
        Use this page to get to first value fast: run a workflow, inspect mismatches, replay the
        same run, and export evidence you can share.
      </p>

      <section
        id="run-demo"
        className="my-8 p-6 rounded-xl border border-slate-200 dark:border-slate-800"
      >
        <h2 className="mt-0">5-minute proof demo</h2>
        <p>
          Run <code>pnpm demo</code> to generate a deterministic run, then replay it to verify the
          same fingerprint.
        </p>
        <CodeBlock
          code={`pnpm demo
pnpm settler:replay examples/demo-output/evidence.json`}
          language="bash"
        />
        <p>
          Evidence output: <code>examples/demo-output/evidence.json</code>.
        </p>
      </section>

      {/* Docs Interface Screenshot */}
      <div className="my-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-lg">
        <div className="relative w-full">
          <Image
            src="/assets/marketing/hero-image-1.png"
            alt="Settler API Documentation Interface - Complete API reference with interactive examples and code snippets"
            width={1258}
            height={618}
            className="w-full h-auto object-contain md:object-cover"
            priority={false}
            sizes="100vw"
            style={{ maxWidth: "100%", height: "auto" }}
            unoptimized
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 my-8">
        <Card>
          <CardHeader>
            <Rocket className="w-8 h-8 mb-2 text-blue-600" />
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Install, run, and see first value quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackedLink
              href="/docs/getting-started"
              eventName="docs_cta_clicked"
              eventPayload={{
                location: "docs",
                ctaLabel: "Get Started",
                destination: "/docs/getting-started",
                section: "docs_index_cards",
              }}
            >
              <Button variant="outline" className="w-full">
                Get Started →
              </Button>
            </TrackedLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="w-8 h-8 mb-2 text-green-600" />
            <CardTitle>Quickstart</CardTitle>
            <CardDescription>Run the canonical local workflow end-to-end</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackedLink
              href="/docs/quickstart"
              eventName="docs_cta_clicked"
              eventPayload={{
                location: "docs",
                ctaLabel: "Quickstart Guide",
                destination: "/docs/quickstart",
                section: "docs_index_cards",
              }}
            >
              <Button variant="outline" className="w-full">
                Quickstart Guide →
              </Button>
            </TrackedLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Code className="w-8 h-8 mb-2 text-purple-600" />
            <CardTitle>API Reference</CardTitle>
            <CardDescription>Integrate run, replay, and evidence workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackedLink
              href="/docs/api"
              eventName="docs_cta_clicked"
              eventPayload={{
                location: "docs",
                ctaLabel: "View API Reference",
                destination: "/docs/api",
                section: "docs_index_cards",
              }}
            >
              <Button variant="outline" className="w-full">
                View API Reference →
              </Button>
            </TrackedLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="w-8 h-8 mb-2 text-amber-600" />
            <CardTitle>Auth & Security</CardTitle>
            <CardDescription>Review auth, tenant boundaries, and controls</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackedLink
              href="/docs/auth"
              eventName="docs_cta_clicked"
              eventPayload={{
                location: "docs",
                ctaLabel: "Security Guide",
                destination: "/docs/auth",
                section: "docs_index_cards",
              }}
            >
              <Button variant="outline" className="w-full">
                Security Guide →
              </Button>
            </TrackedLink>
          </CardContent>
        </Card>
      </div>

      <section className="mb-12">
        <h2>Quick Example</h2>
        <CodeBlock
          code={`import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: "..." }
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." }
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});

// Run the job
const report = await client.jobs.run(job.id);
// eslint-disable-next-line no-console
console.log(\`Matched: \${report.summary.matched}/\${report.summary.total}\`);`}
          language="typescript"
        />
      </section>

      <section className="mb-12">
        <h2>How Data Flows</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Understand how Settler processes data from source to target platforms.
        </p>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="relative w-full aspect-[2/1]">
            <SafeImage
              src="/assets/diagrams/data-flow.svg"
              alt="Settler data flow diagram showing how data moves from source platforms through adapters to reconciliation engine and target platforms"
              width={1200}
              height={600}
              className="w-full h-full object-contain"
              fallbackTitle="Data Flow Diagram"
              fallbackCaption="Visual representation of Settler's data processing pipeline"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              unoptimized
            />
          </div>
        </div>
      </section>
    </div>
  );
}
