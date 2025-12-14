/**
 * Feature Flags API Marketing Page
 * 
 * Product page for Settler Feature Flags API - a free developer toolkit for feature flag management.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ToggleLeft, Code, Zap, Gift } from 'lucide-react';

export default function FeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-purple/10 mb-6">
            <ToggleLeft className="w-8 h-8 text-electric-purple" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-electric-purple to-electric-indigo bg-clip-text text-transparent">
            Feature Flags API
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
            A simple, developer-friendly feature flag service. LaunchDarkly-lite, built by developers for developers.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-8">
            <Gift className="w-4 h-4" />
            <span>Free Forever - No Credit Card Required</span>
          </div>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-electric-purple hover:bg-electric-purple/90">
              <Link href="/docs/api">View API Docs</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/console/playground/flags">Try Playground</Link>
            </Button>
          </div>
        </div>

        {/* Why Free */}
        <div className="bg-slate-900 rounded-lg p-8 mb-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Why We Built This</h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            We know what it's like to wrestle with feature flags. Most services are expensive, 
            over-engineered, or require complex setup. We built a simple API that just works. 
            It's free because we're developers too, and we want to help you ship faster.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-lg border border-slate-200 bg-white">
            <Code className="w-8 h-8 text-electric-purple mb-4" />
            <h3 className="text-xl font-semibold mb-2">Simple API</h3>
            <p className="text-slate-600">
              RESTful endpoints that make sense. Create flags, set environments, evaluate values. 
              No SDK complexity.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-slate-200 bg-white">
            <Zap className="w-8 h-8 text-electric-cyan mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast Evaluation</h3>
            <p className="text-slate-600">
              Sub-10ms evaluation times. Built on Settler's infrastructure with global edge caching.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-slate-200 bg-white">
            <ToggleLeft className="w-8 h-8 text-electric-indigo mb-4" />
            <h3 className="text-xl font-semibold mb-2">Environments & Overrides</h3>
            <p className="text-slate-600">
              Organize flags by environment (prod, staging, dev). Override per-user or per-tenant 
              for testing.
            </p>
          </div>
        </div>

        {/* Example */}
        <div className="bg-slate-900 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">Example Usage</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-400 mb-2">Create a flag:</p>
              <pre className="text-sm text-slate-300 overflow-x-auto">
{`POST /api/v1/feature-flags
{
  "key": "new-dashboard",
  "name": "New Dashboard UI",
  "type": "boolean",
  "defaultValue": false
}`}
              </pre>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Evaluate in your app:</p>
              <pre className="text-sm text-slate-300 overflow-x-auto">
{`POST /api/v1/feature-flags/evaluate
{
  "flagKey": "new-dashboard",
  "environment": "production",
  "context": { "userId": "user_123" }
}

Response:
{
  "value": true,
  "source": "environment",
  "environment": "production"
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-slate-50">
              <h3 className="text-xl font-semibold mb-2">Gradual Rollouts</h3>
              <p className="text-slate-600">
                Enable features for specific users or percentages. Test in production safely.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-slate-50">
              <h3 className="text-xl font-semibold mb-2">A/B Testing</h3>
              <p className="text-slate-600">
                Use string/number flags to test different variants and measure impact.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-slate-50">
              <h3 className="text-xl font-semibold mb-2">Emergency Kill Switches</h3>
              <p className="text-slate-600">
                Quickly disable features without deploying. Critical for production stability.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-slate-50">
              <h3 className="text-xl font-semibold mb-2">Environment Management</h3>
              <p className="text-slate-600">
                Different flag values for prod, staging, and dev. Keep environments in sync.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-electric-purple to-electric-indigo rounded-lg p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Start Using Feature Flags Today</h2>
          <p className="text-lg mb-6 opacity-90">
            Free forever. No credit card. No limits on evaluations. Just simple, reliable feature flags.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/console/playground/flags">Try Playground</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
