/**
 * Stripe App Integration
 * React.Settler components for Stripe Connect apps
 * 
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
import { FEATURE_FLAGS, useFeatureGate } from '../utils/licensing';

import { ReconciliationDashboard } from '../components/ReconciliationDashboard';
import { TransactionTable } from '../components/TransactionTable';
import { ExceptionTable } from '../components/ExceptionTable';
import { MetricCard } from '../components/MetricCard';
import { ExportButton } from '../components/ExportButton';
import { UpgradePrompt } from '../components/UpgradePrompt';
import type {
  ReconciliationTransaction,
  ReconciliationException
} from '@settler/protocol';

export interface StripeAppProps {
  accountId: string;
  transactions?: ReconciliationTransaction[];
  exceptions?: ReconciliationException[];
  onExport?: (format: string, data: unknown[]) => void;
}

/**
 * Stripe Connect App Wrapper
 * Optimized for Stripe dashboard integration
 */
export function StripeApp({
  accountId,
  transactions = [],
  exceptions = [],
  onExport
}: StripeAppProps) {
  const { hasAccess } = useFeatureGate(FEATURE_FLAGS.STRIPE_INTEGRATION);
  
  if (!hasAccess) {
    return <UpgradePrompt feature={FEATURE_FLAGS.STRIPE_INTEGRATION} featureName="Stripe Integration" />;
  }
  
  return (
    <div
      style={{
        padding: '1.5rem',
        backgroundColor: '#fafafa',
        minHeight: '100vh'
      }}
      data-stripe-app
      data-account-id={accountId}
    >
      <ReconciliationDashboard>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>
              Reconciliation Dashboard
            </h1>
            {transactions.length > 0 && (
              <ExportButton
                data={transactions}
                format="csv"
                onExport={onExport}
              />
            )}
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Stripe Account: {accountId}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <MetricCard
            title="Total Revenue"
            value={`$${transactions.reduce((sum, tx) => sum + tx.amount.value, 0).toFixed(2)}`}
            subtitle="This period"
          />
          <MetricCard
            title="Transactions"
            value={transactions.length}
            subtitle="Processed"
          />
          <MetricCard
            title="Match Rate"
            value={`${Math.round((transactions.length - exceptions.length) / Math.max(transactions.length, 1) * 100)}%`}
            subtitle="Successfully matched"
            trend="up"
          />
          <MetricCard
            title="Exceptions"
            value={exceptions.length}
            subtitle="Requiring review"
            trend={exceptions.length > 0 ? 'down' : 'neutral'}
          />
        </div>

        {transactions.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <TransactionTable transactions={transactions} />
          </div>
        )}

        {exceptions.length > 0 && (
          <div>
            <ExceptionTable exceptions={exceptions} />
          </div>
        )}
      </ReconciliationDashboard>
    </div>
  );
}
