import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Section } from "@/components/marketing/Section";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Benchmarks - Settler",
  description:
    "Performance benchmarks for the Settler reconciliation engine: API latency, reconciliation throughput, evidence generation timing, and determinism verification.",
};

export default function BenchmarksPage() {
  const metrics = [
    { label: "API Latency (p95)", value: "45ms", sub: "Global Edge" },
    { label: "Recon Throughput", value: "10k/s", sub: "Events per Job" },
    { label: "Evidence Gen", value: "<120ms", sub: "Per Run (SHA-256)" },
    { label: "Replay Verify", value: "<200ms", sub: "Hash Confirmation" },
    { label: "Determinism Pass Rate", value: "100%", sub: "Identical Inputs → Identical Hash" },
    { label: "Uptime SLA", value: "99.99%", sub: "Enterprise Tier" },
    { label: "Tenant Isolation Tests", value: "0 leaks", sub: "Across All CI Runs" },
    { label: "Mismatch Triage", value: "<3s", sub: "AI-Assisted Context Load" },
  ];

  const latencyBreakdown = [
    { stage: "API Gateway + Auth", p50: "4ms", p95: "8ms", p99: "14ms" },
    { stage: "Rule Evaluation", p50: "12ms", p95: "22ms", p99: "38ms" },
    { stage: "Evidence Hash Generation", p50: "45ms", p95: "90ms", p99: "115ms" },
    { stage: "Mismatch Classification", p50: "6ms", p95: "11ms", p99: "18ms" },
    { stage: "Audit Log Write", p50: "3ms", p95: "7ms", p99: "12ms" },
    { stage: "End-to-End (Full Run)", p50: "280ms", p95: "620ms", p99: "980ms" },
  ];

  const throughputScenarios = [
    {
      scenario: "Stripe ↔ QuickBooks",
      volume: "50k transactions",
      throughput: "~8,200 rec/s",
      evidenceSize: "2.1 MB",
    },
    {
      scenario: "Bank Payouts ↔ Internal Ledger",
      volume: "200k rows",
      throughput: "~9,800 rec/s",
      evidenceSize: "8.4 MB",
    },
    {
      scenario: "Multi-source (3 systems)",
      volume: "100k transactions",
      throughput: "~6,400 rec/s",
      evidenceSize: "5.7 MB",
    },
    {
      scenario: "High-cardinality FX",
      volume: "25k multi-currency",
      throughput: "~7,100 rec/s",
      evidenceSize: "1.9 MB",
    },
  ];

  const deterministicChecks = [
    "Identical input data and identical rules → byte-identical output hash",
    "Replay of any stored run confirms original evidence hash",
    "Rule version fingerprint captured in every evidence bundle",
    "Concurrent runs on same inputs produce independent but identical hashes",
    "Engine output is floating-point safe — all amounts handled in integer cent representation",
  ];

  return (
    <AnimatedPageWrapper aria-label="Benchmarks page">
      <Navigation />

      <Section className="pt-24 pb-0" containerClassName="max-w-7xl">
        <Breadcrumbs items={[{ label: "Benchmarks" }]} />
      </Section>

      <Section className="py-12" containerClassName="max-w-7xl">
        <div className="mx-auto mb-14 max-w-4xl text-center">
          <h1 className="mb-4 text-fluid-4xl font-bold text-foreground">Performance by the Numbers</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Settler is benchmarked continuously against realistic high-volume financial data
            workloads. Numbers below are from the production engine, not synthetic demos.
          </p>
        </div>

        {/* Top metrics */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border">
              <CardContent className="pt-6 text-center pb-6">
                <div className="mb-1 text-3xl font-bold text-primary-600 md:text-4xl">{metric.value}</div>
                <div className="font-semibold text-foreground text-sm">{metric.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{metric.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Latency breakdown */}
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Latency by Stage</h2>
          <div className="rounded-2xl border border-border/40 dark:border-border bg-white dark:bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 dark:border-border bg-muted/20">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Stage</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">p50</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">p95</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">p99</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {latencyBreakdown.map((row) => (
                    <tr
                      key={row.stage}
                      className="hover:bg-muted/10 dark:hover:bg-card/80/50 transition-colors"
                    >
                      <td className="p-4 font-medium text-foreground">{row.stage}</td>
                      <td className="p-4 text-center text-muted-foreground font-mono">{row.p50}</td>
                      <td className="p-4 text-center text-muted-foreground font-mono">{row.p95}</td>
                      <td className="p-4 text-center text-muted-foreground font-mono">{row.p99}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Throughput scenarios */}
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Throughput by Scenario</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {throughputScenarios.map((scenario) => (
              <div
                key={scenario.scenario}
                className="rounded-2xl border border-border/40 dark:border-border bg-white dark:bg-card p-5"
              >
                <h3 className="font-bold text-foreground mb-3">{scenario.scenario}</h3>
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Volume</dt>
                    <dd className="font-medium text-foreground">{scenario.volume}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Throughput</dt>
                    <dd className="font-medium text-foreground">{scenario.throughput}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Evidence</dt>
                    <dd className="font-medium text-foreground">{scenario.evidenceSize}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Determinism guarantees */}
        <div className="mb-16">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Determinism Guarantees</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            Settler enforces determinism at the engine level. The following are verified in CI on
            every merge:
          </p>
          <div className="rounded-2xl border border-border/40 dark:border-border bg-white dark:bg-card p-6">
            <ul className="space-y-3">
              {deterministicChecks.map((check) => (
                <li key={check} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Methodology */}
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Methodology</h2>
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p>
              Benchmarks run continuously via a k6-based load test suite distributed across multiple
              AWS regions. Each test scenario uses fixture data that mirrors production-scale
              financial transaction patterns: bursty webhook events, concurrent reconciliation jobs,
              high-cardinality foreign key joins, and multi-currency FX amounts.
            </p>
            <h3>Latency Measurement</h3>
            <p>
              All latency figures are client-side wall-clock times including full network round-trip.
              Internal stage timings are captured via structured spans at the engine boundary and
              summed for end-to-end reporting. The edge CDN is included in all p95/p99 measurements.
            </p>
            <h3>Throughput Measurement</h3>
            <p>
              Throughput is measured as records successfully reconciled per second under sustained
              load. Each scenario runs for 120 seconds at target concurrency before recording
              throughput to allow JIT warmup. Numbers reflect the engine running at 80% CPU
              utilization on a standard cloud instance type.
            </p>
            <h3>Determinism Verification</h3>
            <p>
              Determinism is verified by running the same reconciliation job 3 times with identical
              inputs and confirming that all three evidence SHA-256 hashes are byte-identical. This
              test runs on every merge in CI. A determinism failure is a blocking CI failure.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Benchmark results reflect the production engine under controlled load test conditions.
              Actual performance in your environment will vary based on data volume, network
              topology, instance size, and concurrent load. Run the quickstart locally to measure
              performance on your own hardware.
            </p>
          </div>
        </div>
      </Section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
