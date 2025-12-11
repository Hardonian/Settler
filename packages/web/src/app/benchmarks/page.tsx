import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';

export default function BenchmarksPage() {
  const metrics = [
    { label: 'API Latency (p95)', value: '45ms', sub: 'Global Edge' },
    { label: 'Recon Throughput', value: '10k/s', sub: 'Events per Job' },
    { label: 'OCR Accuracy', value: '99.8%', sub: 'Financial Documents' },
    { label: 'Uptime SLA', value: '99.99%', sub: 'Enterprise Tier' },
  ];

  return (
    <AnimatedPageWrapper aria-label="Benchmarks page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Benchmarks' }]} />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Performance by the Numbers
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            We rigorously benchmark Settler against high-volume workloads to ensure 
            it scales with your business.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{metric.value}</div>
                <div className="font-semibold text-slate-900 dark:text-white">{metric.label}</div>
                <div className="text-sm text-slate-500">{metric.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Methodology</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
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
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
