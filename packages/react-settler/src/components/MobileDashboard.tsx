/**
 * MobileDashboard Component
 * Mobile-optimized reconciliation dashboard
 */

import { useState, useMemo } from 'react';
import { ReconciliationDashboard } from './ReconciliationDashboard';
import { TransactionTable } from './TransactionTable';
import { ExceptionTable } from './ExceptionTable';
import { MetricCard } from './MetricCard';
import { SearchBar } from './SearchBar';
import type {
  ReconciliationTransaction,
  ReconciliationException
} from '@settler/protocol';
import { useTelemetry } from '../hooks/useTelemetry';

export interface MobileDashboardProps {
  transactions: ReconciliationTransaction[];
  exceptions: ReconciliationException[];
  onTransactionSelect?: (tx: ReconciliationTransaction) => void;
  onExceptionResolve?: (exc: ReconciliationException) => void;
  className?: string;
}

/**
 * Mobile-optimized dashboard with responsive design
 */
export function MobileDashboard({
  transactions,
  exceptions,
  onTransactionSelect,
  onExceptionResolve,
  className
}: MobileDashboardProps) {
  const { track } = useTelemetry('MobileDashboard');
  const [activeTab, setActiveTab] = useState<'transactions' | 'exceptions'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(tx =>
      tx.id.toLowerCase().includes(query) ||
      tx.provider.toLowerCase().includes(query) ||
      tx.providerTransactionId.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  return (
    <ReconciliationDashboard {...(className !== undefined ? { className } : {})}>
      <div
        style={{
          padding: '1rem',
          maxWidth: '100%',
          backgroundColor: '#fff'
        }}
        data-mobile-dashboard
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#111827'
            }}
          >
            Reconciliation
          </h1>
          
          {/* Metrics - Horizontal scroll on mobile */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div style={{ minWidth: '140px', flexShrink: 0 }}>
              <MetricCard
                title="Transactions"
                value={transactions.length}
                subtitle="Total"
              />
            </div>
            <div style={{ minWidth: '140px', flexShrink: 0 }}>
              <MetricCard
                title="Match Rate"
                value={`${Math.round((transactions.length - exceptions.length) / Math.max(transactions.length, 1) * 100)}%`}
                subtitle="Success"
              />
            </div>
            <div style={{ minWidth: '140px', flexShrink: 0 }}>
              <MetricCard
                title="Exceptions"
                value={exceptions.length}
                subtitle="Review"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <SearchBar
            onSearch={(query) => {
              setSearchQuery(query);
              track('search.executed', { query, platform: 'mobile' });
            }}
            placeholder="Search transactions..."
            debounceMs={300}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '1rem'
          }}
          role="tablist"
          aria-label="Dashboard tabs"
        >
          <button
            onClick={() => {
              setActiveTab('transactions');
              track('tab.switched', { tab: 'transactions' });
            }}
            role="tab"
            aria-selected={activeTab === 'transactions'}
            aria-controls="transactions-panel"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'transactions' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'transactions' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'transactions' ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('exceptions');
              track('tab.switched', { tab: 'exceptions' });
            }}
            role="tab"
            aria-selected={activeTab === 'exceptions'}
            aria-controls="exceptions-panel"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'exceptions' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'exceptions' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'exceptions' ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Exceptions ({exceptions.length})
          </button>
        </div>

        {/* Content */}
        <div
          role="tabpanel"
          id="transactions-panel"
          aria-hidden={activeTab !== 'transactions'}
          style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}
        >
          {filteredTransactions.length > 0 ? (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <TransactionTable
                transactions={filteredTransactions}
                {...(onTransactionSelect !== undefined ? { onSelect: onTransactionSelect } : {})}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#6b7280'
              }}
            >
              <p>No transactions found</p>
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          id="exceptions-panel"
          aria-hidden={activeTab !== 'exceptions'}
          style={{ display: activeTab === 'exceptions' ? 'block' : 'none' }}
        >
          {exceptions.length > 0 ? (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <ExceptionTable
                exceptions={exceptions}
                {...(onExceptionResolve !== undefined ? { onResolve: onExceptionResolve } : {})}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#6b7280'
              }}
            >
              <p>No exceptions found</p>
            </div>
          )}
        </div>
      </div>
    </ReconciliationDashboard>
  );
}
