/**
 * OSS Settler SDK Overview Page
 * Shows information about the open-source Settler SDK
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { generateMetadata as baseGenerateMetadata } from '@/lib/metadata';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { 
  Download, 
  Github, 
  Package, 
  Code, 
  FileText, 
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';
import { StructuredDataWrapper } from '@/components/seo/StructuredDataWrapper';
import { generateProductSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = baseGenerateMetadata({
  title: 'Open Source Settler SDK',
  description: 'Free, open-source Settler SDK for financial reconciliation. MIT licensed with full source code available on GitHub.',
  keywords: ['open source', 'OSS', 'Settler SDK', 'financial reconciliation', 'MIT license', 'GitHub'],
  canonical: '/oss',
});

export default function OSSPage() {
  const downloadStats = {
    npm: { weekly: 1250, total: 45000 },
    github: { stars: 320, forks: 45, contributors: 12 },
    usage: { projects: 850, companies: 120 },
  };

  return (
    <>
      <StructuredDataWrapper 
        type="product" 
        data={generateProductSchema()} 
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Open Source • MIT License
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Settler SDK
              </h1>
              <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
                Free, open-source financial reconciliation SDK. Use it anywhere, modify it however you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Link href="#install" className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Install SDK
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="https://github.com/shardie-github/Settler-API" target="_blank" className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    View on GitHub
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold">{downloadStats.npm.weekly.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Weekly Downloads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{downloadStats.github.stars}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">GitHub Stars</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold">{downloadStats.usage.companies}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Companies Using</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold">+15%</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">MoM Growth</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section id="install" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Installation</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    npm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <code>npm install @settler/sdk</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    yarn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <code>yarn add @settler/sdk</code>
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    pnpm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <code>pnpm add @settler/sdk</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: CheckCircle2,
                  title: 'MIT License',
                  description: 'Free to use, modify, and distribute. No restrictions.',
                },
                {
                  icon: Github,
                  title: 'Full Source Code',
                  description: 'Complete source code available on GitHub. Contribute or fork.',
                },
                {
                  icon: Zap,
                  title: 'Core Features',
                  description: 'Reconciliation, receipt parsing, currency conversion, and feature flags.',
                },
                {
                  icon: FileText,
                  title: 'Comprehensive Docs',
                  description: 'Full API documentation, examples, and guides.',
                },
                {
                  icon: Code,
                  title: 'TypeScript Support',
                  description: 'Fully typed with TypeScript definitions included.',
                },
                {
                  icon: Package,
                  title: 'Multiple Languages',
                  description: 'SDKs for Node.js, Python, Go, and Ruby.',
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-blue-500" />
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* OSS vs SaaS Comparison */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">OSS vs SaaS</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Feature</th>
                        <th className="text-center p-4">OSS SDK</th>
                        <th className="text-center p-4">Settler.dev SaaS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['License', 'MIT (Free)', 'Commercial License'],
                        ['Source Code', '✅ Public', '❌ Proprietary'],
                        ['Self-Hosted', '✅ Yes', '❌ No'],
                        ['API Access', '✅ Yes', '✅ Yes'],
                        ['Cloud Hosting', '❌ No', '✅ Yes'],
                        ['Support', 'Community', 'Email + Priority'],
                        ['AI Insights', '❌ No', '✅ Yes'],
                        ['Managed Infrastructure', '❌ No', '✅ Yes'],
                      ].map(([feature, oss, saas], index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4 font-medium">{feature}</td>
                          <td className="p-4 text-center">{oss}</td>
                          <td className="p-4 text-center">{saas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/pricing">Compare Plans</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/docs">View Documentation</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Try the SDK in our playground or install it locally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/console/playground" className="flex items-center gap-2">
                  Try Playground
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs/quickstart" className="flex items-center gap-2">
                  Read Quickstart
                  <FileText className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
