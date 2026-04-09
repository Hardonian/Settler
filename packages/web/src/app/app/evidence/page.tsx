import Link from "next/link";
import { FileSearch, Fingerprint, Shield, ArrowRight, BookOpen, Terminal } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const queryModes = [
  {
    key: "Run ID",
    description:
      "Fetch the canonical evidence bundle for a specific reconciliation run, including all matched and unmatched records, policy evaluations, and deterministic fingerprints.",
    example: "/api/v1/runs/run_01HXYZ/evidence",
    icon: FileSearch,
    badge: "Primary",
    badgeVariant: "default" as const,
  },
  {
    key: "Fingerprint",
    description:
      "Confirm exact deterministic output lineage for a known fingerprint. Validates that the run output has not been modified since execution.",
    example: "/api/v1/runs/:id/evidence?fingerprint=sha256:...",
    icon: Fingerprint,
    badge: "Cryptographic",
    badgeVariant: "info" as const,
  },
  {
    key: "Policy Hash",
    description:
      "Audit which policy version was active when a run was executed. Ensures regulatory compliance by linking execution context to governance rules.",
    example: "/api/v1/runs/:id/evidence?policy_hash=...",
    icon: Shield,
    badge: "Compliance",
    badgeVariant: "success" as const,
  },
];

const relatedLinks = [
  {
    href: "/app/runs",
    label: "Run Explorer",
    description: "Browse and inspect reconciliation runs",
    icon: Terminal,
  },
  {
    href: "/console/proof-explorer",
    label: "Truth Explorer",
    description: "Verify deterministic proof artifacts",
    icon: Shield,
  },
  {
    href: "/console/exceptions",
    label: "Exception Queue",
    description: "Review and adjudicate reconciliation exceptions",
    icon: FileSearch,
  },
];

export default function EvidencePage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Trust Surface"
        title="Evidence Query Surface"
        description="Evidence retrieval is tenant-scoped and designed for deterministic audit workflows. Every reconciliation run produces an immutable evidence bundle queryable by run identifier, fingerprint, or policy hash."
        icon={FileSearch}
        variant="hero"
        actions={
          <Link
            href="/docs/api"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Full API reference
          </Link>
        }
      />

      {/* Endpoint reference */}
      <Card className="panel shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                REST Endpoint
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase tracking-wide">
                  GET
                </span>
                <code className="code-inline text-sm">/api/v1/runs/:id/evidence</code>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="success">Tenant-scoped</Badge>
              <Badge variant="outline">Immutable</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Query modes */}
      <section>
        <h2 className="section-eyebrow mb-4">Query Modes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {queryModes.map((mode) => (
            <article
              key={mode.key}
              className="evidence-block flex flex-col gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <mode.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{mode.key}</h3>
                </div>
                <Badge variant={mode.badgeVariant} size="sm">
                  {mode.badge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {mode.description}
              </p>
              <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                <p className="break-all font-mono text-xs text-foreground">{mode.example}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Related surfaces */}
      <section>
        <h2 className="section-eyebrow mb-4">Related Surfaces</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 group-hover:bg-primary/10 transition-colors">
                  <link.icon
                    className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {link.description}
                  </p>
                </div>
              </div>
              <ArrowRight
                className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
