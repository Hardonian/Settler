import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@settler/react-settler/ui/card';
import { Button } from '@settler/react-settler/ui/button';

export default function BillingPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Billing & Usage
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Manage your subscription and monitor your reconciliation usage.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Free Tier */}
        <Card className="relative overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200 dark:border-gray-800 transition-all hover:shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Developer</CardTitle>
            <CardDescription>Perfect for testing and small projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">$0<span className="text-sm font-normal text-gray-500">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Up to 500 transactions/mo</li>
              <li>✓ 1 Integration</li>
              <li>✓ Community Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Pro Tier (Usage Based) */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 transform scale-105 shadow-2xl transition-all">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-bl-lg">
            RECOMMENDED
          </div>
          <CardHeader>
            <CardTitle className="text-2xl text-indigo-900 dark:text-indigo-100">Growth (Pay-as-you-go)</CardTitle>
            <CardDescription className="text-indigo-700 dark:text-indigo-300">For scaling startups and solo founders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4 text-indigo-900 dark:text-indigo-100">$99<span className="text-sm font-normal text-indigo-600 dark:text-indigo-400">/mo + $0.01/txn</span></div>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
              <li>✓ Unlimited transactions</li>
              <li>✓ All Integrations (Stripe, QuickBooks, etc.)</li>
              <li>✓ AI Support Deflection</li>
              <li>✓ Multi-entity support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Upgrade Now</Button>
          </CardFooter>
        </Card>

        {/* Enterprise Tier */}
        <Card className="relative overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200 dark:border-gray-800 transition-all hover:shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>Custom SLA and dedicated infrastructure.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">Custom</div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Dedicated TigerBeetle cluster</li>
              <li>✓ SOC2 Compliance Reports</li>
              <li>✓ 24/7 Phone Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Contact Sales</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Current Usage (This Month)</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">4,201 / 10,000 transactions processed</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">42%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Estimated upcoming charge: <strong className="text-gray-900 dark:text-white">$141.01</strong></p>
      </div>
    </div>
  );
}
