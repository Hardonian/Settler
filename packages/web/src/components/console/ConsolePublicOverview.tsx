/**
 * Console Public Overview Component
 * 
 * Shows an overview of the Developer Console for visitors who are not signed in.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Key, BarChart3, Receipt, ToggleLeft, BookOpen, CreditCard, Zap, Shield, Code } from 'lucide-react';

export function ConsolePublicOverview() {
  const features = [
    {
      icon: Key,
      title: 'API Key Management',
      description: 'Create, manage, and revoke API keys with granular permissions and scopes.',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: BarChart3,
      title: 'Usage Analytics',
      description: 'Monitor API usage, track performance metrics, and analyze service breakdowns.',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Receipt,
      title: 'Receipt Processing',
      description: 'Upload and manage receipts with automatic parsing and data extraction.',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: ToggleLeft,
      title: 'Feature Flags',
      description: 'Control feature rollouts with environment-specific flags and A/B testing.',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: CreditCard,
      title: 'Billing & Plans',
      description: 'View usage-based billing, manage subscriptions, and track spending.',
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: BookOpen,
      title: 'API Documentation',
      description: 'Interactive API docs with code examples and live playground.',
      color: 'text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
          Developer Console
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Manage your API keys, monitor usage, and control your Settler integration from one unified dashboard.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/playground">Try Playground</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">View Documentation</Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Zap className="w-8 h-8 text-yellow-500 mb-2" />
            <CardTitle>Real-time Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Track API calls, errors, and performance metrics in real-time with live activity feeds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="w-8 h-8 text-green-500 mb-2" />
            <CardTitle>Secure & Reliable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Enterprise-grade security with encrypted API keys, role-based access, and audit logs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Code className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle>Developer-First</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Built for developers with comprehensive APIs, SDKs, and interactive documentation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Ready to get started?</CardTitle>
          <CardDescription className="text-blue-100">
            Sign up for free and start building with Settler's powerful APIs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
