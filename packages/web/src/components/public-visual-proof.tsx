import Link from "next/link";
import {
  ArrowRight,
  Cloud,
  Code2,
  GitBranch,
  Lock,
  MonitorSmartphone,
  Server,
  Shield,
  TerminalSquare,
  Workflow,
} from "lucide-react";

type Node = {
  title: string;
  detail: string;
  badge?: string;
};

const platformLayers: { heading: string; nodes: Node[] }[] = [
  {
    heading: "Product surfaces",
    nodes: [
      {
        title: "Public site",
        detail: "Routes under src/app for product, architecture, docs, roadmap.",
      },
      {
        title: "Operator console",
        detail: "Authenticated routes under src/app/app for runs, policies, proofs, and audit.",
      },
      { title: "APIs + docs", detail: "Route handlers under src/app/api and OpenAPI surface." },
    ],
  },
  {
    heading: "Control plane + deterministic engine",
    nodes: [
      {
        title: "Reconciliation + proof services",
        detail: "Domain + lib modules for run execution, evidence, replay, and validation.",
      },
      {
        title: "Policy + governance",
        detail: "Policies, rule evaluation, approvals, and entitlement boundaries.",
      },
      {
        title: "Observability + diagnostics",
        detail: "Audit logs, trust graph checks, and system health surfaces.",
        badge: "Tenant-safe",
      },
    ],
  },
  {
    heading: "Execution + data boundary",
    nodes: [
      {
        title: "Workers + adapters",
        detail: "packages/adapters, jobforge adapter packages, and CLI-triggered jobs.",
      },
      {
        title: "Storage + cache",
        detail: "Database access, Redis/cache modules, and immutable evidence artifacts.",
      },
      {
        title: "External systems",
        detail:
          "Stripe/ERP/bank sources through adapter interfaces and signed ingestion endpoints.",
      },
    ],
  },
];

const integrationSurface = [
  {
    label: "CLI",
    detail: "packages/cli for local runs, automation, and CI orchestration.",
    icon: TerminalSquare,
  },
  {
    label: "SDKs",
    detail: "packages/sdk, sdk-java, sdk-csharp, and react-settler integration points.",
    icon: Code2,
  },
  {
    label: "API",
    detail: "REST/route handlers in src/app/api with OpenAPI schema route support.",
    icon: Workflow,
  },
  {
    label: "Events + hooks",
    detail: "Webhook and async flow support through queue/worker modules and replay traces.",
    icon: GitBranch,
  },
];

const capabilityClusters = [
  {
    title: "Deterministic reconciliation",
    bullets: [
      "Rule-based matching with explicit tolerances",
      "Replayable run semantics",
      "Mismatch classification and explainability",
    ],
  },
  {
    title: "Evidence + auditability",
    bullets: [
      "Proof explorer and evidence routes",
      "Hash-linked output artifacts",
      "Traceability across run lifecycle",
    ],
  },
  {
    title: "Tenant safety + governance",
    bullets: [
      "Shared tenant middleware + context boundaries",
      "Policy enforcement surfaces",
      "Role-aware operator workflows",
    ],
  },
  {
    title: "Developer ergonomics",
    bullets: [
      "CLI + SDK onboarding",
      "Docs, cookbook, and quickstart routes",
      "Adapter extension model",
    ],
  },
];

const journey = [
  {
    lane: "User",
    steps: ["Connect sources", "Define matching rules", "Launch run", "Review mismatches + proof"],
  },
  {
    lane: "Operator",
    steps: [
      "Monitor run health",
      "Investigate exceptions",
      "Approve governed changes",
      "Export audit evidence",
    ],
  },
  {
    lane: "Developer",
    steps: ["Install CLI/SDK", "Configure adapters", "Integrate API/webhooks", "Automate in CI"],
  },
];

const packaging = [
  {
    title: "Open source core",
    icon: Server,
    detail: "Core engine, CLI, and SDK packages available in this repository.",
    routes: ["/open-source", "/oss", "packages/*"],
  },
  {
    title: "Cloud / managed workflows",
    icon: Cloud,
    detail: "Hosted control-plane and dashboard experiences surfaced through web routes.",
    routes: ["/dashboard", "/app/*", "/status"],
  },
  {
    title: "Enterprise controls",
    icon: Shield,
    detail: "Policy, audit, and trust-oriented features highlighted in enterprise and trust pages.",
    routes: ["/enterprise", "/trust", "/security-and-audit"],
  },
];

export function PlatformOverviewDiagram() {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-background"
      aria-label="Platform overview diagram"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          System map
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground dark:text-slate-100">
          Platform overview: surfaces, control plane, and runtime boundary
        </h2>
      </div>
      <div className="space-y-4">
        {platformLayers.map((layer) => (
          <div key={layer.heading}>
            <h3 className="mb-3 text-sm font-semibold text-foreground dark:text-muted-foreground">
              {layer.heading}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {layer.nodes.map((node) => (
                <article
                  key={node.title}
                  className="rounded-xl border border-border bg-muted/20 p-4 dark:border-border dark:bg-slate-950/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground dark:text-slate-100">
                      {node.title}
                    </p>
                    {node.badge ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {node.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{node.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WorkflowJourneyDiagram() {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-background"
      aria-label="Workflow journey diagram"
    >
      <div className="mb-6 flex items-center gap-3">
        <MonitorSmartphone className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-semibold text-foreground dark:text-slate-100">
          User, operator, and developer journey lanes
        </h2>
      </div>
      <div className="space-y-4">
        {journey.map((row) => (
          <div
            key={row.lane}
            className="rounded-xl border border-border p-4 dark:border-border"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {row.lane}
            </p>
            <div className="grid gap-3 md:grid-cols-4">
              {row.steps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-2 rounded-lg bg-muted/20 p-3 text-sm dark:bg-slate-950/40"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-semibold text-white dark:bg-card dark:text-foreground">
                    {index + 1}
                  </span>
                  <span className="text-foreground dark:text-muted-foreground">{step}</span>
                  {index < row.steps.length - 1 ? (
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CapabilityMap() {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-background"
      aria-label="Capability map"
    >
      <h2 className="text-2xl font-semibold text-foreground dark:text-slate-100">
        Capability map grounded in shipped surfaces
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {capabilityClusters.map((cluster) => (
          <article
            key={cluster.title}
            className="rounded-xl border border-border p-4 dark:border-border"
          >
            <h3 className="text-base font-semibold text-foreground dark:text-slate-100">
              {cluster.title}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
              {cluster.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function IntegrationAndPackagingMap() {
  return (
    <section className="grid gap-6 lg:grid-cols-2" aria-label="Integration and packaging maps">
      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-background">
        <h2 className="text-2xl font-semibold text-foreground dark:text-slate-100">
          Integration surface map
        </h2>
        <div className="mt-5 space-y-3">
          {integrationSurface.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-border p-4 dark:border-border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-foreground dark:text-slate-100">{item.label}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-background">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600" />
          <h2 className="text-2xl font-semibold text-foreground dark:text-slate-100">
            Packaging boundary map
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
          Boundaries are based on repository packages and current public route structure.
        </p>
        <div className="mt-5 space-y-3">
          {packaging.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border p-4 dark:border-border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-foreground dark:text-muted-foreground" />
                  <p className="font-semibold text-foreground dark:text-slate-100">{item.title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{item.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                  {item.routes.join(" · ")}
                </p>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

export function VisualProofCTA() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/30">
      <p className="text-sm text-foreground dark:text-muted-foreground">
        Want deeper implementation proof? See{" "}
        <Link href="/architecture" className="font-semibold text-blue-700 dark:text-blue-300">
          architecture
        </Link>
        ,{" "}
        <Link href="/product" className="font-semibold text-blue-700 dark:text-blue-300">
          workflow lanes
        </Link>
        , and{" "}
        <Link href="/changelog" className="font-semibold text-blue-700 dark:text-blue-300">
          changelog
        </Link>{" "}
        with shipped versus directional separation.
      </p>
    </div>
  );
}
