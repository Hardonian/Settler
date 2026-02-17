/**
 * SDK Documentation Hub Page
 * 
 * Overview of all available SDKs with links to detailed documentation
 */

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Code2, Package, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DocsSdkPage() {
  const sdks = [
    {
      name: 'Node.js/TypeScript',
      description: 'Production-grade TypeScript SDK with full type safety',
      href: '/docs/sdk/nodejs',
      language: 'TypeScript',
      status: 'stable',
      features: ['Full TypeScript Support', 'Automatic Retries', 'Request Deduplication'],
      install: 'npm install @settler/sdk',
    },
    {
      name: 'Python',
      description: 'Pythonic SDK with async support and type hints',
      href: '/docs/sdk/python',
      language: 'Python 3.8+',
      status: 'stable',
      features: ['Async/Await Support', 'Type Hints', 'Production Ready'],
      install: 'pip install settler-sdk',
    },
    {
      name: 'Go',
      description: 'Go SDK with context support and concurrent safety',
      href: '/docs/sdk/go',
      language: 'Go 1.21+',
      status: 'stable',
      features: ['Context Support', 'Concurrent Safe', 'Minimal Dependencies'],
      install: 'go get github.com/settler/settler-go',
    },
    {
      name: 'Ruby',
      description: 'Ruby SDK with idiomatic Ruby patterns',
      href: '/docs/sdk/ruby',
      language: 'Ruby 3.0+',
      status: 'beta',
      features: ['Ruby Idioms', 'Gem Support', 'Full API Coverage'],
      install: 'gem install settler-sdk',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Docs', href: '/docs' },
          { label: 'SDK' },
        ]} />

        <div className="mt-8 mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            SDK Documentation
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Choose your language and get started with Settler in minutes. All SDKs are production-ready with automatic retries, error handling, and full API coverage.
          </p>
        </div>

        {/* SDK Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sdks.map((sdk) => (
            <Card key={sdk.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-2xl">{sdk.name}</CardTitle>
                  </div>
                  <Badge variant={sdk.status === 'stable' ? 'default' : 'secondary'}>
                    {sdk.status}
                  </Badge>
                </div>
                <CardDescription className="text-base">{sdk.description}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{sdk.language}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <ul className="space-y-1">
                      {sdk.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Installation</h3>
                    <code className="block p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm overflow-x-auto whitespace-nowrap">
                      {sdk.install}
                    </code>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={sdk.href}>
                      View Documentation <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Additional resources to help you get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/console/playground">
                  <Zap className="w-4 h-4 mr-2" />
                  Try Playground
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/docs/api">
                  <Package className="w-4 h-4 mr-2" />
                  API Reference
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/docs/examples">
                  <Code2 className="w-4 h-4 mr-2" />
                  Code Examples
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
