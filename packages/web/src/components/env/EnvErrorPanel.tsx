/**
 * Environment Error Panel
 * 
 * Displays a friendly error message when environment variables are missing.
 * Used instead of crashing with a 500 error.
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EnvErrorPanelProps {
  missingVars: string[];
}

export function EnvErrorPanel({ missingVars }: EnvErrorPanelProps) {
  // Log error once to console
  if (typeof window !== 'undefined') {
    console.error(
      '[Env] Missing required environment variables:',
      missingVars.join(', ')
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Configuration Required</CardTitle>
          </div>
          <CardDescription>
            Missing required environment variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              The following environment variables are required but not configured:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              {missingVars.map((key) => (
                <li key={key} className="font-mono text-xs">
                  {key}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>For developers:</strong> Please ensure these variables are set in your{' '}
              <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.env.local</code> file
              or your deployment environment.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild>
              <Link href="/console/setup-check">Run Diagnostics</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
