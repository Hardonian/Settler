import { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'API Reference - Docs',
  description: 'Complete Settler API reference',
};

const endpoints = [
  {
    method: 'POST',
    path: '/api/v1/jobs',
    description: 'Create a new reconciliation job',
    example: `const job = await client.jobs.create({
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
});`,
  },
  {
    method: 'GET',
    path: '/api/v1/jobs/:id',
    description: 'Get reconciliation job details',
    example: `const job = await client.jobs.get(jobId);
// eslint-disable-next-line no-console
console.log(job.status); // 'pending' | 'running' | 'completed' | 'failed'`,
  },
  {
    method: 'POST',
    path: '/api/v1/jobs/:id/run',
    description: 'Run a reconciliation job',
    example: `const report = await client.jobs.run(jobId);
// eslint-disable-next-line no-console
console.log(report.summary);`,
  },
  {
    method: 'POST',
    path: '/api/v1/receipts/parse',
    description: 'Parse a receipt image or PDF',
    example: `const receipt = await client.receipts.parse({
  file: "https://example.com/receipt.jpg",
});
// eslint-disable-next-line no-console
console.log(receipt.total, receipt.merchant);`,
  },
  {
    method: 'GET',
    path: '/api/v1/reports/:jobId',
    description: 'Get reconciliation report',
    example: `const report = await client.reports.get(jobId);
// eslint-disable-next-line no-console
console.log(report.summary);
// {
//   total: 150,
//   matched: 145,
//   unmatched: 3,
//   conflicts: 2,
//   accuracy: 0.987
// }`,
  },
];

export default function ApiReferencePage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>API Reference</h1>
      
      <p className="text-lg text-slate-600 dark:text-slate-400">
        Complete reference for all Settler API endpoints. All endpoints require authentication via API key.
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-6">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>🔑 Authentication:</strong> Include your API key in the Authorization header: 
          <code className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded ml-2">
            Authorization: Bearer sk_live_...
          </code>
        </p>
      </div>

      <section>
        <h2>Base URL</h2>
        <p>
          All API requests should be made to:
        </p>
        <CodeBlock
          code="https://api.settler.dev"
          language="text"
        />
      </section>

      <section>
        <h2>Endpoints</h2>
        <div className="space-y-6 my-6">
          {endpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      endpoint.method === 'POST' ? 'default' :
                      endpoint.method === 'GET' ? 'secondary' :
                      'outline'
                    }
                  >
                    {endpoint.method}
                  </Badge>
                  <CardTitle className="text-lg font-mono">{endpoint.path}</CardTitle>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={endpoint.example} language="typescript" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2>Response Format</h2>
        <p>All successful responses follow this format:</p>
        <CodeBlock
          code={`{
  "data": {
    // Response data
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2025-12-18T12:00:00Z"
  }
}`}
          language="json"
        />
      </section>

      <section>
        <h2>Error Format</h2>
        <p>Errors follow this format:</p>
        <CodeBlock
          code={`{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400
  }
}`}
          language="json"
        />
      </section>

      <section>
        <h2>Rate Limits</h2>
        <p>See <Link href="/docs/status">Status & Limits</Link> for current rate limits.</p>
      </section>
    </div>
  );
}
