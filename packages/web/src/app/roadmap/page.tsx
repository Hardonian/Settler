import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoadmapPage() {
  const roadmap = {
    now: [
      "Node.js SDK v1.0",
      "Trust & Compliance Portal",
      "Receipts API with AI OCR",
      "Reconciliation Playground"
    ],
    next: [
      "Python & Go SDKs",
      "Webhooks v2 with Retries",
      "Self-Hosted Enterprise Edition",
      "Advanced Conflict Resolution UI"
    ],
    later: [
      "Mobile SDKs (iOS/Android)",
      "Global Tax Calculation Engine",
      "Anomaly Detection Alerts",
      "QuickBooks Desktop Adapter"
    ],
    considering: [
      "Blockchain Transaction Recon",
      "Predictive Cash Flow Analysis",
      "Natural Language Querying",
      "Managed PCI Vault"
    ]
  };

  return (
    <AnimatedPageWrapper aria-label="Roadmap page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Roadmap' }]} />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Public Roadmap
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            We build in the open. Here's what we're working on to help you build better financial software.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader>
              <Badge className="w-fit bg-green-500 hover:bg-green-600 mb-2">Now</Badge>
              <CardTitle>Q1 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.now.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
              <Badge className="w-fit bg-blue-500 hover:bg-blue-600 mb-2">Next</Badge>
              <CardTitle>Q2 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.next.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10">
            <CardHeader>
              <Badge className="w-fit bg-purple-500 hover:bg-purple-600 mb-2">Later</Badge>
              <CardTitle>H2 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.later.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">Considering</Badge>
              <CardTitle>Future</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {roadmap.considering.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
