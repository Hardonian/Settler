/**
 * React.Settler Demo Page
 * 
 * Demonstrates using @settler/react-settler components in the Settler dashboard.
 * This page dogfoods the react-settler library with real reconciliation data.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard,
  RuleSet,
  MatchRule,
  compileToJSON
} from '@settler/react-settler';
import type {
  ReconciliationTransaction,
  ReconciliationException
} from '@settler/react-settler';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useJobs } from '@/lib/hooks/use-jobs';
import { DataLoader } from '@/components/ui/data-loader';
import { ErrorState } from '@/components/ui/error-state';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function ReactSettlerDemoPage() {
  const [apiKey] = useState(() => {
    // In a real app, get from auth context or env
    return typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search).get('apiKey') || ''
      : '';
  });

  // Use React Query hook for jobs data
  const jobsQuery = useJobs({
    apiKey,
    limit: 10,
    enabled: !!apiKey,
  });

  // Transform jobs to transactions (this could be moved to a data transformation function)
  const transactions: ReconciliationTransaction[] = useMemo(() => {
    if (!jobsQuery.data) return [];
    return jobsQuery.data.map((job, idx) => ({
      id: `tx-${job.id}`,
      provider: ((job.source as unknown) as Record<string, unknown>)?.adapter as string || 'stripe',
      providerTransactionId: `ch_${job.id.slice(0, 10)}`,
      amount: { value: 100.0 * (idx + 1), currency: 'USD' },
      currency: 'USD',
      date: job.createdAt || new Date().toISOString(),
      status: 'succeeded',
      referenceId: job.name
    }));
  }, [jobsQuery.data]);

  // Mock exceptions (in production, this would come from API)
  const exceptions: ReconciliationException[] = useMemo(() => [
    {
      id: 'exc-1',
      category: 'amount_mismatch',
      severity: 'high',
      description: 'Transaction amount does not match settlement',
      resolutionStatus: 'open',
      createdAt: new Date().toISOString()
    }
  ], []);

  // Compile workflow to JSON (static, doesn't need to be in state)
  const configJson = useMemo(() => {
    const workflow = (
      <ReconciliationDashboard>
        <RuleSet id="demo-rules" name="Demo Rules" priority="exact-first">
          <MatchRule
            id="rule-1"
            name="Exact Amount Match"
            field="amount"
            type="exact"
            priority={1}
          />
          <MatchRule
            id="rule-2"
            name="Date Range Match"
            field="date"
            type="range"
            tolerance={{ days: 7 }}
            priority={2}
          />
        </RuleSet>
      </ReconciliationDashboard>
    );

    return compileToJSON(workflow, {
      name: 'Settler Dashboard Demo',
      description: 'Demo reconciliation workflow',
      pretty: true
    });
  }, []);

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              Please provide an API key via the <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">?apiKey=...</code> query parameter.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">React.Settler Demo</h1>
        <p className="text-slate-600 dark:text-slate-300">
          This page demonstrates the @settler/react-settler component library
          integrated into the Settler dashboard.
        </p>
      </div>

      <DataLoader
        query={jobsQuery}
        isEmpty={(data) => data.length === 0}
        errorComponent={(error) => (
          <ErrorState
            error={error}
            title="Failed to load reconciliation data"
            onRetry={() => jobsQuery.refetch()}
          />
        )}
        emptyComponent={
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No reconciliation jobs found.</p>
          </div>
        }
      >
        {(data) => (
          <ReconciliationDashboard>
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Total Transactions"
            value={transactions.length}
            subtitle="Reconciliation transactions"
          />
          <MetricCard
            title="Match Rate"
            value="95%"
            subtitle="19 of 20 matched"
            trend="up"
          />
          <MetricCard
            title="Exceptions"
            value={exceptions.length}
            subtitle="Requiring review"
            trend="neutral"
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Transactions</h2>
          </div>
          <div className="p-6">
            <TransactionTable
              transactions={transactions}
              onSelect={(tx: ReconciliationTransaction) => {
                console.log('Selected transaction:', tx);
                alert(`Selected transaction: ${tx.id}`);
              }}
            />
          </div>
        </div>

        {/* Exceptions Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Exceptions</h2>
          </div>
          <div className="p-6">
            <ExceptionTable
              exceptions={exceptions}
              onResolve={(exc: ReconciliationException) => {
                console.log('Resolving exception:', exc);
                alert(`Resolving exception: ${exc.id}`);
              }}
            />
          </div>
        </div>

        {/* Compiled Config */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Compiled Configuration</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              JSON config extracted from React component tree
            </p>
          </div>
          <div className="p-6">
            <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded overflow-auto text-sm text-slate-900 dark:text-slate-100">
              {configJson}
            </pre>
          </div>
        </div>
      </ReconciliationDashboard>
        )}
      </DataLoader>
      </div>
      <Footer />
    </div>
  );
}
