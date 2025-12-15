/**
 * Ruby SDK Documentation Page
 */

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ui/code-block';
import Link from 'next/link';
import { Package, Code2, Zap, Shield } from 'lucide-react';

export default function RubySDKPage() {
  const features = [
    { icon: Code2, title: 'Ruby Idioms', description: 'Follows Ruby best practices' },
    { icon: Zap, title: 'Gem Support', description: 'Available as Ruby gem' },
    { icon: Shield, title: 'Error Handling', description: 'Comprehensive error classes' },
    { icon: Package, title: 'Full Coverage', description: 'Complete API coverage' },
  ];

  const installationCode = `gem install settler-sdk
# or add to Gemfile
gem 'settler-sdk'`;

  const quickstartCode = `require 'settler'

# Initialize client
client = Settler::Client.new(api_key: 'sk_your_api_key')

# Create a reconciliation job
job = client.jobs.create(
  name: 'Shopify-Stripe Reconciliation',
  source: {
    adapter: 'shopify',
    config: {
      api_key: ENV['SHOPIFY_API_KEY'],
      shop: 'your-shop',
    },
  },
  target: {
    adapter: 'stripe',
    config: {
      api_key: ENV['STRIPE_SECRET_KEY'],
    },
  },
  rules: {
    matching: [
      { field: 'order_id', type: 'exact' },
      { field: 'amount', type: 'exact', tolerance: 0.01 },
    ],
  },
)

# Run the job
execution = client.jobs.run(job['id'])

# Get report
report = client.reports.get(job['id'])
puts "Matched: #{report['summary']['matched']}"
puts "Unmatched: #{report['summary']['unmatched']}"`;

  const errorHandlingCode = `require 'settler'

begin
  job = client.jobs.create({...})
rescue Settler::ValidationError => e
  puts "Validation error: #{e.message}"
  puts "Field: #{e.field}"
rescue Settler::AuthError => e
  puts "Authentication failed: #{e.message}"
rescue Settler::RateLimitError => e
  puts "Rate limit exceeded. Retry after: #{e.retry_after}"
rescue Settler::NetworkError => e
  puts "Network error: #{e.message}"
rescue Settler::Error => e
  puts "Error: #{e.message}"
end`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Docs', href: '/docs' },
          { label: 'SDK', href: '/docs/sdk' },
          { label: 'Ruby' },
        ]} />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600">Official SDK</Badge>
            <Badge variant="outline">Ruby 3.0+</Badge>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Ruby SDK
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Ruby SDK with idiomatic Ruby patterns and full API coverage.
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
            <CardDescription>Install using gem</CardDescription>
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
            <CodeBlock code={quickstartCode} language="ruby" />
          </CardContent>
        </Card>

        {/* Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
            <CardDescription>Handle errors gracefully</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={errorHandlingCode} language="ruby" />
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
            <Link href="/docs/sdk/nodejs">
              Node.js SDK →
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
