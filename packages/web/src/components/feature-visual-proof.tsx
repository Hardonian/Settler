import Link from "next/link";
import { ArrowRight, GitBranch, Link2, ShieldCheck, TerminalSquare } from "lucide-react";

const integrationFlow = [
  {
    title: "Connector handshake",
    detail: "Authenticate provider accounts and validate webhook signatures before ingest.",
    route: "/integrations/request",
  },
  {
    title: "Canonical normalization",
    detail: "Map provider payloads into deterministic reconciliation primitives.",
    route: "/app/connections",
  },
  {
    title: "Run + divergence detection",
    detail: "Execute reconciliations and classify mismatches for operator review.",
    route: "/app/runs",
  },
  {
    title: "Evidence + replay",
    detail: "Persist proof artifacts and replay trace context for audit verification.",
    route: "/proof-explorer",
  },
];

const proofLifecycle = [
  {
    label: "Input attestation",
    detail: "Source and target payload hashes are captured at ingestion time.",
  },
  {
    label: "Deterministic evaluation",
    detail: "Rule engine evaluates canonical records with explicit tolerances.",
  },
  {
    label: "Artifact generation",
    detail: "Mismatch sets, trace metadata, and outcome envelope are emitted.",
  },
  {
    label: "Verification + replay",
    detail: "Operators verify lineage and reproduce outcomes from stored evidence.",
  },
];

const consoleSurfaces = [
  {
    title: "Execution control",
    detail: "Runs, traces, and pipeline status surfaces under /app and /console routes.",
    icon: TerminalSquare,
  },
  {
    title: "Governance + policy",
    detail: "Policy and audit workflows enforce explicit approvals and reviewer accountability.",
    icon: ShieldCheck,
  },
  {
    title: "Evidence graph",
    detail: "Proof explorer and replay routes expose lineage across transaction artifacts.",
    icon: GitBranch,
  },
];

export function IntegrationFlowDiagram() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-blue-600" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Integration runtime flow
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {integrationFlow.map((step, index) => (
          <article
            key={step.title}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Step {index + 1}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.detail}</p>
            <p className="mt-2 text-xs text-slate-500">Route: {step.route}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProofLifecycleDiagram() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Proof lifecycle map
      </h2>
      <div className="mt-4 space-y-3">
        {proofLifecycle.map((step, index) => (
          <div
            key={step.label}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                {index + 1}
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{step.label}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ConsoleSurfaceMap() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Console surface map
        </h2>
        <Link
          href="/architecture"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
        >
          Full architecture <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {consoleSurfaces.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <Icon className="h-4 w-4 text-blue-600" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
