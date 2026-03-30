import Link from "next/link";
import { FileSearch, Fingerprint, Shield, ArrowRight } from "lucide-react";

const queryModes = [
  {
    key: "Run ID",
    description:
      "Fetch the canonical evidence bundle for a specific reconciliation run, including all matched and unmatched records, policy evaluations, and deterministic fingerprints.",
    example: "/api/v1/runs/run_01HXYZ/evidence",
    icon: FileSearch,
  },
  {
    key: "Fingerprint",
    description:
      "Confirm exact deterministic output lineage for a known fingerprint. Validates that the run output has not been modified since execution.",
    example: "/api/v1/runs/:id/evidence?fingerprint=sha256:...",
    icon: Fingerprint,
  },
  {
    key: "Policy Hash",
    description:
      "Audit which policy version was active when a run was executed. Ensures regulatory compliance by linking execution context to governance rules.",
    example: "/api/v1/runs/:id/evidence?policy_hash=...",
    icon: Shield,
  },
];

const relatedLinks = [
  {
    href: "/app/runs",
    label: "Run Explorer",
    description: "Browse and inspect reconciliation runs",
  },
  {
    href: "/console/proof-explorer",
    label: "Truth Explorer",
    description: "Verify deterministic proof artifacts",
  },
  {
    href: "/console/exceptions",
    label: "Exception Queue",
    description: "Review and adjudicate reconciliation exceptions",
  },
];

export default function EvidencePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trust Surface
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Evidence Query Surface</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Evidence retrieval is tenant-scoped and designed for deterministic audit workflows. Every
          reconciliation run produces an immutable evidence bundle that can be queried by run
          identifier, fingerprint, or policy hash.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              API Endpoint
            </p>
            <code className="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">
              GET /api/v1/runs/:id/evidence
            </code>
          </div>
          <Link href="/docs/api" className="text-sm text-primary hover:underline">
            Full API reference
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Query Modes
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {queryModes.map((mode) => (
            <article key={mode.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-muted p-2">
                  <mode.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{mode.key}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="break-all font-mono text-xs text-foreground">{mode.example}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Related Surfaces
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
