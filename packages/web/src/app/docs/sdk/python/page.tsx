/**
 * Python SDK Documentation Page
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

export default function PythonSDKPage() {
  const features = [
    { icon: Code2, title: 'Pythonic API', description: 'Clean, intuitive Python interface' },
    { icon: Zap, title: 'Automatic Retries', description: 'Exponential backoff built-in' },
    { icon: Shield, title: 'Type Hints', description: 'Full type annotations for IDE support' },
    { icon: Package, title: 'Production Ready', description: 'Battle-tested in production' },
  ];

  const installationCode = `pip install settler-sdk
# or
pip3 install settler-sdk`;

  const quickstartCode = `from settler import SettlerClient

# Initialize client
client = SettlerClient(api_key="sk_your_api_key")

# Create a reconciliation job
job = client.jobs.create(
    name="Shopify-Stripe Reconciliation",
    source={
        "adapter": "shopify",
        "config": {
            "api_key": "your_shopify_api_key",
            "shop": "your-shop",
        },
    },
    target={
        "adapter": "stripe",
        "config": {
            "api_key": "sk_your_stripe_key",
        },
    },
    rules={
        "matching": [
            {"field": "order_id", "type": "exact"},
            {"field": "amount", "type": "exact", "tolerance": 0.01},
        ],
    },
)

# Run the job
execution = client.jobs.run(job["id"])

# Get report
report = client.reports.get(job["id"])
print(f"Matched: {report['summary']['matched']}")
print(f"Unmatched: {report['summary']['unmatched']}")`;

  const errorHandlingCode = `from settler import SettlerClient
from settler.errors import (
    SettlerError,
    NetworkError,
    AuthError,
    ValidationError,
    RateLimitError,
)

try:
    job = client.jobs.create({...})
except ValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Field: {e.field}")
except AuthError as e:
    print(f"Authentication failed: {e.message}")
except RateLimitError as e:
    print(f"Rate limit exceeded. Retry after: {e.retry_after}")
except NetworkError as e:
    print(f"Network error: {e.message}")
except SettlerError as e:
    print(f"Error: {e.message}")`;

  const paginationCode = `# Iterate over all jobs
for job in client.jobs.list_paginated():
    print(job.name)

# Or get all at once
all_jobs = list(client.jobs.list_paginated())`;

  const asyncCode = `import asyncio
from settler.async_client import AsyncSettlerClient

async def main():
    client = AsyncSettlerClient(api_key="sk_your_api_key")
    
    # Create job asynchronously
    job = await client.jobs.create({...})
    
    # Run multiple operations concurrently
    results = await asyncio.gather(
        client.jobs.get(job["id"]),
        client.reports.get(job["id"]),
    )
    
    return results

asyncio.run(main())`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Docs', href: '/docs' },
          { label: 'SDK', href: '/docs/sdk' },
          { label: 'Python' },
        ]} />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600">Official SDK</Badge>
            <Badge variant="outline">Python 3.8+</Badge>
            <Badge variant="outline">Async Support</Badge>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Python SDK
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Production-grade Python SDK with async support and full type hints.
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
            <CardDescription>Install using pip</CardDescription>
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
            <CodeBlock code={quickstartCode} language="python" />
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
                <TabsTrigger value="async">Async/Await</TabsTrigger>
              </TabsList>
              <TabsContent value="pagination">
                <CodeBlock code={paginationCode} language="python" />
              </TabsContent>
              <TabsContent value="errors">
                <CodeBlock code={errorHandlingCode} language="python" />
              </TabsContent>
              <TabsContent value="async">
                <CodeBlock code={asyncCode} language="python" />
              </TabsContent>
            </Tabs>
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
            <Link href="/docs/sdk/go">
              Go SDK →
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
