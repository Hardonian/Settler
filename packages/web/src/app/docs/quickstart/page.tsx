import { Metadata } from 'next';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quickstart - Docs',
  description: 'Get started with deterministic reconciliation in Settler',
};

const steps = [
  {
    title: 'Create a Workspace',
    description: 'Create a workspace to organize reconciliation runs',
    code: `# Using the SDK
import { Settler } from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

# Or use the App
# Visit /app to create a workspace via UI`,
    action: { label: 'Open App', href: '/app' },
  },
  {
    title: 'Create a Reconciliation Run',
    description: 'Define deterministic rules for matching',
    code: `const job = await client.jobs.create({
  name: "My First Reconciliation",
  source: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  target: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});

// eslint-disable-next-line no-console
console.log("Job created:", job.id);`,
    action: { label: 'See Integrations', href: '/integrations' },
  },
  {
    title: 'Upload Receipt/Data',
    description: 'Upload transactions or normalized data',
    code: `# Parse a receipt
const receipt = await client.receipts.parse({
  file: "https://example.com/receipt.jpg",
});

// eslint-disable-next-line no-console
console.log("Receipt parsed:", receipt.total, receipt.merchant);

# Or upload CSV/JSON
const upload = await client.data.upload({
  file: fileBuffer,
  format: "csv",
});`,
    action: { label: 'Review API Formats', href: '/docs/api' },
  },
  {
    title: 'View Results',
    description: 'Review variances and evidence',
    code: `# Get job status
const status = await client.jobs.get(job.id);
// eslint-disable-next-line no-console
console.log("Status:", status.status);

# Get report
const report = await client.reports.get(job.id);
// eslint-disable-next-line no-console
console.log("Matched:", report.summary.matched);
// eslint-disable-next-line no-console
console.log("Unmatched:", report.summary.unmatched);`,
    action: { label: 'Open Reports', href: '/docs/api' },
  },
];

export default function QuickstartPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Quickstart Guide</h1>
      
      <p className="text-lg text-slate-600 dark:text-slate-400">
        Get started with Settler. Follow these steps to create a deterministic reconciliation run.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Settler surfaces variances and evidence. Your team reviews and resolves outcomes.
        </p>
      </div>

      <div className="space-y-8 my-8">
        {steps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  {index + 1}
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </div>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock code={step.code} language="typescript" />
              {step.action && (
                <Button variant="outline" asChild>
                  <Link href={step.action.href}>
                    {step.action.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 my-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Next Steps
        </h2>
        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
          <li>• <Link href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">Explore the API Reference</Link></li>
          <li>• <Link href="/integrations" className="text-blue-600 dark:text-blue-400 hover:underline">Browse available integrations</Link></li>
          <li>• <Link href="/docs/auth" className="text-blue-600 dark:text-blue-400 hover:underline">Learn about authentication</Link></li>
          <li>• <Link href="/open-source" className="text-blue-600 dark:text-blue-400 hover:underline">Review the open-source governance</Link></li>
        </ul>
      </div>
    </div>
  );
}
