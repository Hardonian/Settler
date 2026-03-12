import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { WorkflowJourneyDiagram } from "@/components/public-visual-proof";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";

const implementationProof = [
  {
    title: "Connect",
    detail:
      "Use adapter-backed source and target definitions for Stripe, databases, and file feeds.",
    route: "/app/connections",
  },
  {
    title: "Define",
    detail: "Write deterministic matching rules and policies before each run.",
    route: "/app/rules",
  },
  {
    title: "Execute",
    detail: "Launch runs and track pipeline execution, traces, and system health.",
    route: "/app/runs",
  },
  {
    title: "Verify",
    detail: "Inspect proofs, audit logs, and mismatch classifications with replay support.",
    route: "/app/proofs",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <section className="px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "How It Works" }]} />
          <h1 className="mt-6 text-4xl font-bold text-slate-900 dark:text-slate-100">
            Workflow proof from integration to audit evidence
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-400">
            Settler runs are designed to be deterministic, inspectable, and tenant-safe. This page
            maps the shipped workflow across user, operator, and developer personas.
          </p>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {implementationProof.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
              <p className="mt-3 text-xs text-slate-500">Primary route: {item.route}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <WorkflowJourneyDiagram />

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              CLI and API execution proof
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Teams can execute the same workflow in CI or local environments through the CLI and
              SDK layers.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">
              <code>{`pnpm --filter @settler/cli start reconcile \\
  --config ./reconciliation.config.ts \\
  --output ./recon_output/latest.json`}</code>
            </pre>
          </article>

          <RealityEvidencePanel scope="architecture" title="Workflow evidence references" />

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/architecture">View architecture</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/quickstart">Read quickstart</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
