import Link from "next/link";

const workflows = [
  {
    name: "Evidence Query Workflow",
    description:
      "Pull run evidence by run id, fingerprint, or policy hash and keep trust artifacts machine-readable for audits.",
    cta: "Open Evidence Query Surface",
    href: "/app/evidence",
  },
  {
    name: "Replay Workflow",
    description:
      "Inspect a run, replay deterministic execution, and confirm whether output hashes remain stable.",
    cta: "Open Replay Lab",
    href: "/app/replay",
  },
  {
    name: "Truth Investigation",
    description:
      "Drill into proof lineage, impacted artifacts, and verification checks for run-level evidence review.",
    cta: "Open Truth Explorer",
    href: "/app/proofs",
  },
  {
    name: "Policy Simulation",
    description:
      "Review policy posture and evaluate tolerance impacts on runtime behavior before rollout.",
    cta: "Open Policy Lab",
    href: "/app/policies",
  },
  {
    name: "Live Operations",
    description:
      "Track live alerts, route into affected runs, and monitor system telemetry for operator triage.",
    cta: "Open Live Alerts",
    href: "/app/alerts",
  },
];

const quickLinks = [
  {
    label: "Tenant Isolation Controls",
    href: "/app/settings",
    detail: "Role boundaries and freeze controls for multi-tenant safety",
  },
  {
    label: "Runtime Event Signals",
    href: "/app/metrics",
    detail: "Event-derived latency and route behavior signals",
  },
  {
    label: "Run Explorer",
    href: "/app/runs",
    detail: "Recent run metadata, status, and policy context",
  },
  {
    label: "System Telemetry",
    href: "/app/system-health",
    detail: "Control-plane health and runtime posture",
  },
  {
    label: "Capability Status",
    href: "/app/capability-status",
    detail: "Availability, gating, and degraded-mode truth",
  },
  {
    label: "Audit Surfaces",
    href: "/app/audit",
    detail: "Security and evidence-facing system surfaces",
  },
  {
    label: "Integrations",
    href: "/app/integrations",
    detail: "Connection and adapter operating state",
  },
];

export default function AppPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Settler Control Plane
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Deterministic Reconciliation Infrastructure
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          This workspace is organized for operator-grade execution: deterministic replay, evidence
          lineage, policy-aware simulation, and live triage surfaces. Use the workflows below to
          move from incident detection to replayable root-cause analysis.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">Differentiated operator workflows</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {workflows.map((workflow) => (
            <article
              key={workflow.name}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-lg font-semibold text-slate-900">{workflow.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{workflow.description}</p>
              <Link
                href={workflow.href}
                className="mt-4 inline-flex text-sm font-medium text-blue-600"
              >
                {workflow.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-900">Trust and control surfaces</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
            >
              <p className="font-medium text-slate-900">{link.label}</p>
              <p className="mt-1 text-sm text-slate-600">{link.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
