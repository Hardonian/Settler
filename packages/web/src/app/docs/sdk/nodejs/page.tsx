/**
 * Node.js/TypeScript SDK Documentation Page
 */

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ui/code-block';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { CheckCircle2, Package, Code2, Zap, Shield, ArrowRight } from 'lucide-react';

export default function NodeJSSDKPage() {
  const features = [
    { icon: Code2, title: 'Full TypeScript Support', description: 'Complete type inference and IntelliSense' },
    { icon: Zap, title: 'Automatic Retries', description: 'Exponential backoff with configurable retry logic' },
    { icon: Shield, title: 'Request Deduplication', description: 'Prevents duplicate in-flight requests' },
    { icon: Package, title: 'Small Bundle', description: '<50KB minified and gzipped' },
  ];

  const installationCode = `npm install @settler/sdk
# or
yarn add @settler/sdk
# or
pnpm add @settler/sdk`;

  const quickstartCode = `import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: 'sk_your_api_key_here',
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: 'Shopify-Stripe Reconciliation',
  source: {
    adapter: 'shopify',
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: 'your-shop.myshopify.com',
    },
  },
  target: {
    adapter: 'stripe',
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: 'order_id', type: 'exact' },
      { field: 'amount', type: 'exact', tolerance: 0.01 },
    ],
  },
});

console.log('Job created:', job.data.id);`;

  const errorHandlingCode = `import {
  SettlerClient,
  NetworkError,
  AuthError,
  ValidationError,
  RateLimitError,
} from '@settler/sdk';

try {
  const job = await client.jobs.create({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Retry after:', error.retryAfter);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}`;

  const paginationCode = `// Iterate over all jobs
for await (const job of client.jobs.listPaginated()) {
  console.log(job.name);
}

// Or collect all at once
import { collectPaginated } from '@settler/sdk';
const allJobs = await collectPaginated(client.jobs.listPaginated());`;

  const webhookCode = `import { verifyWebhookSignature } from '@settler/sdk';

app.post('/webhooks/settler', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-settler-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  // Process webhook event...
});`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Docs', href: '/docs' },
          { label: 'SDK', href: '/docs/sdk' },
          { label: 'Node.js/TypeScript' },
        ]} />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600">Official SDK</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Node.js 18+</Badge>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Node.js/TypeScript SDK
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Production-grade TypeScript SDK with full type safety, automatic retries, and more.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Installation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Installation</CardTitle>
            <CardDescription>Install the SDK using your preferred package manager</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={installationCode} language="bash" />
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started in 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={quickstartCode} language="typescript" />
          </CardContent>
        </Card>

        {/* Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Examples</CardTitle>
            <CardDescription>Common use cases and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pagination" className="w-full">
              <TabsList>
                <TabsTrigger value="pagination">Pagination</TabsTrigger>
                <TabsTrigger value="errors">Error Handling</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>
              <TabsContent value="pagination">
                <CodeBlock code={paginationCode} language="typescript" />
              </TabsContent>
              <TabsContent value="errors">
                <CodeBlock code={errorHandlingCode} language="typescript" />
              </TabsContent>
              <TabsContent value="webhooks">
                <CodeBlock code={webhookCode} language="typescript" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* API Reference Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>Complete API documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Full API Reference</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Complete documentation for all SDK methods and types
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="https://github.com/settler/settler/tree/main/packages/sdk" target="_blank">
                    View on GitHub <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/console/playground">
              Try in Playground
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/sdk/python">
              Python SDK →
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
