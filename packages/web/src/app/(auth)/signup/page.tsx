import React from 'react';
import { Button } from '@settler/react-settler/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@settler/react-settler/ui/card';

export default function SignupFlow() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Get started with Settler
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Automate your financial operations in under 2 minutes. No credit card required.
          </p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-white dark:bg-gray-900 pb-0 pt-6 px-6">
            <CardTitle>1-Click Connect</CardTitle>
            <CardDescription>
              Connect your systems to begin your automated historical sync immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white dark:bg-gray-900 p-6 space-y-4">
            
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Stripe</p>
                  <p className="text-xs text-gray-500">Payment Processor</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                  QB
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">QuickBooks</p>
                  <p className="text-xs text-gray-500">Accounting Ledger</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>

            <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" size="lg">
                Continue to Dashboard &rarr;
              </Button>
              <p className="text-center text-xs text-gray-500 mt-4">
                By connecting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
