'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ConversionCTA } from "@/components/ConversionCTA";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedSidebar } from "@/components/AnimatedSidebar";
import Link from "next/link";

export default function Docs() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Introduction</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Settler is a Reconciliation-as-a-Service API that automates financial and event data reconciliation 
              across fragmented SaaS and e-commerce ecosystems. With Settler, you can reconcile transactions, 
              orders, and events between any two platforms in real-time.
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Our API-first approach means you can integrate reconciliation into your existing workflows without 
              building custom infrastructure or maintaining complex matching logic.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Pro Tip:</strong> Try our <Link href="/playground" className="underline hover:text-blue-600 dark:hover:text-blue-300">interactive playground</Link> to test the API without signing up, or explore our <Link href="/cookbooks" className="underline hover:text-blue-600 dark:hover:text-blue-300">cookbooks</Link> for ready-to-use examples.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Quick Start</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Get started in 5 minutes:
            </p>
            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4">
              <pre className="text-green-400 text-sm">
                <code>{`# Install the SDK
npm install @settler/sdk

# Or with yarn
yarn add @settler/sdk

# Or with pnpm
pnpm add @settler/sdk`}</code>
              </pre>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Need help? Check out our <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">support page</Link> or <Link href="/community" className="text-blue-600 dark:text-blue-400 hover:underline">join our community</Link>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'installation',
      title: 'Installation',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Node.js / TypeScript</h3>
            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4">
              <pre className="text-green-400 text-sm">
                <code>{`import { Settler } from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">React</h3>
            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto mb-4">
              <pre className="text-green-400 text-sm">
                <code>{`import { useSettler } from '@settler/react-settler';

function MyComponent() {
  const { createJob, runJob } = useSettler({
    apiKey: 'sk_...',
  });
  
  // Use the hooks...
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Jobs API</h3>
            <div className="space-y-4">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">POST</Badge>
                    <CardTitle className="text-lg">/api/v1/jobs</CardTitle>
                  </div>
                  <CardDescription>Create a new reconciliation job</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: "..." }
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." }
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 }
    ]
  }
});`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</Badge>
                    <CardTitle className="text-lg">/api/v1/jobs/:id</CardTitle>
                  </div>
                  <CardDescription>Get reconciliation job details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`const job = await client.jobs.get(jobId);
console.log(job.status); // 'pending' | 'running' | 'completed' | 'failed'`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">GET</Badge>
                    <CardTitle className="text-lg">/api/v1/reports/:jobId</CardTitle>
                  </div>
                  <CardDescription>Get reconciliation report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{`const report = await client.reports.get(jobId);
console.log(report.summary);
// {
//   total: 150,
//   matched: 145,
//   unmatched: 3,
//   conflicts: 2,
//   accuracy: 0.987
// }`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'examples',
      title: 'Examples',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">E-commerce Reconciliation</h3>
            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm">
                <code>{`// Reconcile Shopify orders with Stripe payments
const job = await client.jobs.create({
  name: "Monthly Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      shop: "your-shop.myshopify.com",
      accessToken: process.env.SHOPIFY_TOKEN
    }
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY
    }
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "currency", type: "exact" }
    ],
    conflictResolution: "last-wins"
  }
});

// Run the job
const report = await client.jobs.run(job.id);
console.log(\`Matched: \${report.summary.matched}/\${report.summary.total}\`);`}</code>
              </pre>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(s => s.id === activeSection)?.content;

  return (
    <AnimatedPageWrapper aria-label="Documentation page">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Developer Documentation"
        title="Documentation"
        description="Everything you need to integrate Settler into your application"
      />

      {/* Documentation Content */}
      <section
        className="py-12 px-4 sm:px-6 lg:px-8"
        aria-labelledby="docs-content-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="docs-content-heading" className="sr-only">
            Documentation Content
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <AnimatedSidebar
              items={sections.map((s) => ({ id: s.id, title: s.title }))}
              activeId={activeSection}
              onItemClick={setActiveSection}
            />

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-500 hover:shadow-lg"
                role="article"
                aria-labelledby={`section-${activeSection}`}
              >
                <CardContent className="p-8">
                  {activeContent}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Get Started?"
            description="Try Settler in our interactive playground. No signup required."
            primaryAction="Try Playground"
            primaryLink="/playground"
            secondaryAction="View Pricing"
            secondaryLink="/pricing"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
