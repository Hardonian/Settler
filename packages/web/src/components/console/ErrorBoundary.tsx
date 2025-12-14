/**
 * Error Boundary for Console Routes
 * 
 * Prevents 500 errors from crashing the entire page.
 * Shows graceful error UI with actionable next steps.
 */

'use client';

import { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ConsoleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('[ConsoleErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an error while loading this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  This might be due to:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Database connection issues</li>
                  <li>Missing authentication</li>
                  <li>Configuration problems</li>
                  <li>Temporary service unavailability</li>
                </ul>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-xs font-mono text-red-800 dark:text-red-200 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                >
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/console">Go to Console</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/console/setup-check">Run Diagnostics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
