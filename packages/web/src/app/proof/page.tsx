import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  Shield,
  RefreshCw,
  FileText,
  Hash,
  ArrowRight,
  Eye,
  GitBranch,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Proof & Evidence - Settler",
  description:
    "Settler produces cryptographic evidence for every reconciliation run. SHA-256 hash chains, immutable audit trails, and replayable runs — verifiable without re-running.",
};

const evidenceFeatures = [
  {
    icon: Hash,
    title: "SHA-256 Hash Chains",
    description:
      "Every run produces a hash over the full evidence payload. Sequential runs are linked in a chain. Any post-run modification of results is immediately detectable.",
    detail: "Hash is computed over matched records, mismatches, run metadata, and rule fingerprints.",
  },
  {
    icon: RefreshCw,
    title: "Replay Verification",
    description:
      "Any historical run can be replayed from stored inputs and rules. The output hash must match the original. Drift is a bug, not a feature.",
    detail: "pnpm settler:replay <evidence.json> — identical output, verified by hash comparison.",
  },
  {
    icon: FileText,
    title: "Immutable Audit Trail",
    description:
      "Every action — runs, mismatch reviews, resolutions, exports — is logged with actor, timestamp, and payload. Logs are append-only and exportable.",
    detail: "Compatible with SOC 2 evidence collection and GDPR audit workflows.",
  },
  {
    icon: Eye,
    title: "Human-in-the-Loop Review",
    description:
      "Settler does not resolve mismatches autonomously. Every flagged exception requires an explicit human decision with a documented reason.",
    detail: "All review decisions are captured in the audit trail with full context.",
  },
  {
    icon: Lock,
    title: "Tenant Isolation",
    description:
      "Row-level security in PostgreSQL. API keys scoped to tenant context. No shared mutable state between tenants at any layer.",
    detail: "Cross-tenant data leakage is tested in CI on every merge.",
  },
  {
    icon: GitBranch,
    title: "Version-Controlled Rules",
    description:
      "Matching rules are defined in code, committed to your repository, and versioned with your runs. Rule changes produce different run fingerprints.",
    detail: "Any rule regression surfaces immediately in determinism tests.",
  },
];

const evidenceSchemaFields = [
  { field: "run_id", type: "uuid", description: "Globally unique identifier for this run" },
  { field: "run_hash", type: "string (SHA-256)", description: "Hash of the complete evidence payload" },
  { field: "rule_fingerprint", type: "string", description: "Hash of the rule configuration used" },
  { field: "matched_count", type: "integer", description: "Number of records successfully matched" },
  { field: "mismatch_count", type: "integer", description: "Number of records with variances" },
  { field: "unmatched_count", type: "integer", description: "Records with no counterpart found" },
  { field: "executed_at", type: "ISO 8601", description: "UTC timestamp of run execution" },
  { field: "prior_run_hash", type: "string (SHA-256) | null", description: "Hash of the preceding run in the chain" },
  { field: "mismatches", type: "array", description: "Field-level variance records with context" },
];

export default function ProofPage() {
  return (
    <AnimatedPageWrapper aria-label="Proof and evidence page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs items={[{ label: "Proof & Evidence" }]} />
        </div>
      </section>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Badge variant="outline">
              <Shield className="w-3 h-3 mr-1.5" />
              Cryptographic Evidence
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white max-w-3xl">
            Every Run Produces Verifiable Proof
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-8">
            Settler generates a tamper-evident evidence bundle for every reconciliation run — a
            SHA-256 hash chain over matched records, mismatches, and rule fingerprints. Replay
            verification confirms identical output. No trust required.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/proof-explorer">
                <Eye className="w-4 h-4 mr-1.5" />
                Explore Evidence
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs/quickstart">
                Run the Demo <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Evidence features */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-slate-900 border-t border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-10">
            The Evidence Model
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {evidenceFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                    {feature.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Evidence schema */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Evidence Schema
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
            The evidence bundle is a documented, open format. Any external system can parse and
            verify it without running Settler.
          </p>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Field</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                    <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {evidenceSchemaFields.map((row) => (
                    <tr
                      key={row.field}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                          {row.field}
                        </code>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-500 text-xs font-mono">
                        {row.type}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Proof capabilities summary */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-slate-900 dark:bg-slate-800 p-8">
            <h2 className="text-xl font-bold text-white mb-6">What the Evidence Guarantees</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "The evidence was produced by this specific run with this specific input data",
                "The matching rules used are captured by fingerprint — rule changes produce different hashes",
                "Any post-run modification of the evidence payload will break hash verification",
                "Sequential runs form a linked chain — gaps or insertions are detectable",
                "Replay of the run with the same inputs produces byte-identical output",
                "Every mismatch resolution is captured with actor, timestamp, and reason",
              ].map((guarantee) => (
                <div key={guarantee} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{guarantee}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/proof-explorer">
                  <Eye className="w-4 h-4 mr-1.5" />
                  Explore the Evidence Model
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Link href="/security-and-audit">Security &amp; Audit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
