'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedCodeBlock } from "@/components/AnimatedCodeBlock";
import Link from "next/link";
import { 
  ShoppingCart, 
  CreditCard, 
  Building2, 
  Globe, 
  Zap,
  Calendar,
  AlertCircle,
  Key,
  BarChart3,
  RefreshCw
} from "lucide-react";

export default function Cookbooks() {
  const [selectedCookbook, setSelectedCookbook] = useState<string | null>(null);

  const cookbooks = [
    {
      id: 'ecommerce-shopify-stripe',
      title: 'E-commerce Order Reconciliation',
      description: 'Reconcile Shopify orders with Stripe payments for accurate order-to-payment matching.',
      category: 'E-commerce',
      icon: ShoppingCart,
      difficulty: 'Beginner',
      timeToImplement: '5 min',
      useCase: 'Match Shopify orders with Stripe payment transactions to ensure all orders are paid.',
      adapters: ['Shopify', 'Stripe'],
      features: ['Order matching', 'Amount validation', 'Date range matching', 'Scheduled runs'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Daily Order Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM
});

const report = await settler.jobs.run(job.data.id);
console.log(\`Matched: \${report.data.summary.matched}\`);`,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'saas-stripe-quickbooks',
      title: 'SaaS Subscription Reconciliation',
      description: 'Reconcile Stripe subscription revenue with QuickBooks accounting records.',
      category: 'SaaS',
      icon: CreditCard,
      difficulty: 'Intermediate',
      timeToImplement: '10 min',
      useCase: 'Match monthly subscription payments from Stripe with revenue recognition in QuickBooks.',
      adapters: ['Stripe', 'QuickBooks'],
      features: ['Subscription matching', 'Revenue recognition', 'Monthly reconciliation', 'Customer matching'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Monthly Subscription Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "quickbooks",
    config: {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      realmId: process.env.QB_REALM_ID,
    },
  },
  rules: {
    matching: [
      { field: "subscription_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "customer_email", type: "exact" },
    ],
  },
  schedule: "0 0 1 * *", // First day of month at midnight
});`,
      gradient: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'multi-provider',
      title: 'Multi-Payment Provider Reconciliation',
      description: 'Reconcile payments from multiple providers (Stripe, PayPal, Square) with your accounting system.',
      category: 'Multi-Provider',
      icon: Building2,
      difficulty: 'Intermediate',
      timeToImplement: '15 min',
      useCase: 'Consolidate payments from multiple gateways into a single reconciliation workflow.',
      adapters: ['Stripe', 'PayPal', 'Square', 'QuickBooks'],
      features: ['Multi-source matching', 'Provider consolidation', 'Parallel reconciliation', 'Unified reporting'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create jobs for each provider
const stripeJob = await settler.jobs.create({
  name: "Stripe Reconciliation",
  source: { adapter: "stripe", config: { apiKey: process.env.STRIPE_SECRET_KEY } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

const paypalJob = await settler.jobs.create({
  name: "PayPal Reconciliation",
  source: { adapter: "paypal", config: { clientId: process.env.PAYPAL_CLIENT_ID } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
});

// Run all reconciliations in parallel
await Promise.all([
  settler.jobs.run(stripeJob.data.id),
  settler.jobs.run(paypalJob.data.id),
]);`,
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'realtime-webhooks',
      title: 'Real-Time Webhook Reconciliation',
      description: 'Reconcile transactions in real-time as events happen via webhooks.',
      category: 'Real-Time',
      icon: Zap,
      difficulty: 'Advanced',
      timeToImplement: '20 min',
      useCase: 'Get instant reconciliation results as orders and payments occur, enabling real-time financial visibility.',
      adapters: ['Shopify', 'Stripe'],
      features: ['Real-time matching', 'Webhook integration', 'Instant alerts', 'Event-driven'],
      code: `import Settler from "@settler/sdk";
import express from "express";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const app = express();
app.use(express.json());

// Create job
const job = await settler.jobs.create({
  name: "Real-Time Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
});

// Set up webhook
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: [
    "reconciliation.matched",
    "reconciliation.mismatch",
    "reconciliation.error",
  ],
});

// Handle webhook events
app.post("/webhooks/settler", async (req, res) => {
  const { event, data } = req.body;
  
  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam(data);
  }
  
  res.json({ received: true });
});`,
      gradient: 'from-orange-600 to-red-600',
    },
    {
      id: 'exception-handling',
      title: 'Exception Handling & Resolution',
      description: 'Review and resolve unmatched transactions with bulk actions and automated workflows.',
      category: 'Operations',
      icon: AlertCircle,
      difficulty: 'Intermediate',
      timeToImplement: '10 min',
      useCase: 'Manage unmatched transactions, resolve exceptions, and maintain reconciliation accuracy.',
      adapters: ['Any'],
      features: ['Exception queue', 'Bulk resolution', 'Manual review', 'Resolution tracking'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get exceptions (unmatched transactions)
const exceptions = await settler.exceptions.list({
  jobId: "job_abc123",
  resolution_status: "open",
  limit: 50,
});

// Resolve exception
await settler.exceptions.resolve(exceptions.data[0].id, {
  resolution: "matched",
  notes: "Manually verified - amounts match",
});

// Bulk resolve
await settler.exceptions.bulkResolve({
  exceptionIds: exceptions.data.map(e => e.id),
  resolution: "ignored",
  notes: "Low-value transactions, acceptable variance",
});`,
      gradient: 'from-amber-600 to-orange-600',
    },
    {
      id: 'scheduled-reconciliations',
      title: 'Scheduled Reconciliations',
      description: 'Set up automated daily, weekly, or monthly reconciliation jobs with cron scheduling.',
      category: 'Automation',
      icon: Calendar,
      difficulty: 'Beginner',
      timeToImplement: '5 min',
      useCase: 'Automate reconciliation runs on a schedule to ensure regular financial reconciliation.',
      adapters: ['Any'],
      features: ['Cron scheduling', 'Automated runs', 'Flexible timing', 'Reliable execution'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Daily reconciliation at 2 AM
const dailyJob = await settler.jobs.create({
  name: "Daily Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [{ field: "order_id", type: "exact" }] },
  schedule: "0 2 * * *", // Cron: Daily at 2 AM
});

// Weekly reconciliation on Monday at 9 AM
const weeklyJob = await settler.jobs.create({
  name: "Weekly Reconciliation",
  source: { adapter: "stripe", config: { /* ... */ } },
  target: { adapter: "quickbooks", config: { /* ... */ } },
  rules: { matching: [{ field: "transaction_id", type: "exact" }] },
  schedule: "0 9 * * 1", // Cron: Monday at 9 AM
});`,
      gradient: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'multi-currency',
      title: 'Multi-Currency Reconciliation',
      description: 'Reconcile transactions in different currencies with automatic FX conversion.',
      category: 'International',
      icon: Globe,
      difficulty: 'Advanced',
      timeToImplement: '15 min',
      useCase: 'Handle international transactions with automatic currency conversion and FX rate handling.',
      adapters: ['Stripe', 'QuickBooks'],
      features: ['FX conversion', 'Multi-currency support', 'Rate handling', 'Currency matching'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await settler.jobs.create({
  name: "Multi-Currency Reconciliation",
  source: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  target: {
    adapter: "quickbooks",
    config: { /* ... */ },
  },
  rules: {
    matching: [
      { field: "transaction_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    // Enable FX conversion
    fxConversion: {
      enabled: true,
      baseCurrency: "USD",
    },
  },
});`,
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'api-key-management',
      title: 'API Key Management',
      description: 'Manage API keys programmatically with scopes, rate limits, and rotation.',
      category: 'Security',
      icon: Key,
      difficulty: 'Intermediate',
      timeToImplement: '10 min',
      useCase: 'Create, rotate, and manage API keys with proper scoping and security practices.',
      adapters: ['N/A'],
      features: ['Key creation', 'Scope management', 'Rate limiting', 'Key rotation'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// List API keys
const keys = await settler.apiKeys.list();
console.log("API Keys:", keys.data);

// Create new API key
const newKey = await settler.apiKeys.create({
  name: "Production API Key",
  scopes: ["jobs:read", "jobs:write", "reports:read"],
  rateLimit: 2000,
});
console.log("New key:", newKey.data.key); // Only shown once!

// Regenerate API key
const regenerated = await settler.apiKeys.regenerate(keys.data[0].id);
console.log("Regenerated key:", regenerated.data.key);

// Revoke API key
await settler.apiKeys.delete(keys.data[0].id);`,
      gradient: 'from-slate-700 to-slate-900',
    },
    {
      id: 'dashboard-metrics',
      title: 'Dashboard Metrics & Analytics',
      description: 'Track activation, usage metrics, and reconciliation performance over time.',
      category: 'Analytics',
      icon: BarChart3,
      difficulty: 'Intermediate',
      timeToImplement: '10 min',
      useCase: 'Monitor reconciliation performance, track accuracy trends, and measure business metrics.',
      adapters: ['N/A'],
      features: ['Activation tracking', 'Usage metrics', 'Accuracy trends', 'Performance monitoring'],
      code: `import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Get activation dashboard
const activation = await settler.dashboards.activation({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Signup funnel:", activation.data.signupFunnel);
console.log("Time to first value:", activation.data.timeToFirstValue);

// Get usage dashboard
const usage = await settler.dashboards.usage({
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-01-31T23:59:59Z",
});
console.log("Reconciliation volume:", usage.data.reconciliationVolume);
console.log("Accuracy trends:", usage.data.accuracyTrends);`,
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      id: 'error-handling',
      title: 'Error Handling & Retries',
      description: 'Implement robust error handling with retry logic for transient failures.',
      category: 'Reliability',
      icon: RefreshCw,
      difficulty: 'Intermediate',
      timeToImplement: '10 min',
      useCase: 'Handle API errors gracefully with automatic retries and proper error recovery.',
      adapters: ['Any'],
      features: ['Error handling', 'Retry logic', 'Rate limit handling', 'Error recovery'],
      code: `import Settler, { SettlerError } from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function createJobWithRetry(config: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await settler.jobs.create(config);
    } catch (error) {
      if (error instanceof SettlerError) {
        if (error.type === "RateLimitError" && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error("Settler error:", {
          type: error.type,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}`,
      gradient: 'from-red-600 to-rose-600',
    },
  ];

  const categories = ['All', 'E-commerce', 'SaaS', 'Multi-Provider', 'Real-Time', 'Operations', 'Automation', 'International', 'Security', 'Analytics', 'Reliability'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCookbooks = selectedCategory === 'All' 
    ? cookbooks 
    : cookbooks.filter(cb => cb.category === selectedCategory);

  const selectedCookbookData = cookbooks.find(cb => cb.id === selectedCookbook);

  return (
    <AnimatedPageWrapper aria-label="Cookbooks and workflow examples">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Cookbooks & Workflows
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Pre-built reconciliation workflows and recipes for common use cases. Copy, customize, and deploy.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                    : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Cookbooks Grid */}
      <section
        className="py-16 px-4 sm:px-6 lg:px-8"
        aria-labelledby="cookbooks-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 id="cookbooks-heading" className="sr-only">
            Available Cookbooks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCookbooks.map((cookbook) => {
              const Icon = cookbook.icon;
              return (
                <Card
                  key={cookbook.id}
                  className="h-full cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
                  onClick={() => setSelectedCookbook(cookbook.id)}
                >
                  <div className="flex flex-col h-full">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cookbook.gradient} p-2.5 mb-4 flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {cookbook.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {cookbook.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                      {cookbook.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4 flex-grow text-sm leading-relaxed">
                      {cookbook.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span>⏱️ {cookbook.timeToImplement}</span>
                      <span>{cookbook.adapters.join(' → ')}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCookbook(cookbook.id);
                      }}
                    >
                      View Recipe →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Cookbook Detail Modal */}
      {selectedCookbookData && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCookbook(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedCookbookData.category}</Badge>
                    <Badge variant="outline">{selectedCookbookData.difficulty}</Badge>
                    <Badge variant="outline">⏱️ {selectedCookbookData.timeToImplement}</Badge>
                  </div>
                  <CardTitle className="text-2xl text-slate-900 dark:text-white mb-2">
                    {selectedCookbookData.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {selectedCookbookData.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCookbook(null)}
                  className="ml-4"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Use Case</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedCookbookData.useCase}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Adapters</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCookbookData.adapters.map((adapter) => (
                    <Badge key={adapter} variant="outline" className="text-xs">{adapter}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Features</h4>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 text-sm">
                  {selectedCookbookData.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Code Example</h4>
                <AnimatedCodeBlock
                  code={selectedCookbookData.code}
                  title={selectedCookbookData.title}
                  description="Copy this code to get started"
                  language="typescript"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  asChild
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                >
                  <Link href="/playground">Try in Playground</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700"
                  asChild
                >
                  <Link href="/docs">View Docs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">
            Ready to build your workflow?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Start with a cookbook recipe or build your own custom reconciliation workflow in minutes.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              asChild
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              <Link href="/playground">Try Playground</Link>
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-700"
              asChild
            >
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
