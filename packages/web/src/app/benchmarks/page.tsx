import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Section } from "@/components/marketing/Section";
import { Card, CardContent } from "@/components/ui/card";

export default function BenchmarksPage() {
  const metrics = [
    { label: "API Latency (p95)", value: "45ms", sub: "Global Edge" },
    { label: "Recon Throughput", value: "10k/s", sub: "Events per Job" },
    { label: "OCR Accuracy", value: "99.8%", sub: "Financial Documents" },
    { label: "Uptime SLA", value: "99.99%", sub: "Enterprise Tier" },
  ];

  return (
    <AnimatedPageWrapper aria-label="Benchmarks page">
      <Navigation />

      <Section className="pt-24 pb-0" containerClassName="max-w-7xl">
        <Breadcrumbs items={[{ label: "Benchmarks" }]} />
      </Section>

      <Section className="py-12" containerClassName="max-w-7xl">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h1 className="mb-6 text-fluid-4xl font-bold text-foreground">Performance by the Numbers</h1>
          <p className="text-xl text-muted-foreground">
            We rigorously benchmark Settler against high-volume workloads to ensure it scales with
            your business.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl font-bold text-primary-600 md:text-5xl">{metric.value}</div>
                <div className="font-semibold text-foreground">{metric.label}</div>
                <div className="text-sm text-muted-foreground">{metric.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Methodology</h2>
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p>
              Our benchmarks are run daily using a cluster of k6 load generators distributed across
              5 AWS regions. We simulate realistic e-commerce and SaaS traffic patterns, including
              bursty webhook events and concurrent reconciliation jobs.
            </p>
            <h3>Latencies</h3>
            <p>
              Latencies are measured from the client perspective, including network round-trip time.
              Our global edge network ensures low latency regardless of client location.
            </p>
          </div>
        </div>
      </Section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
