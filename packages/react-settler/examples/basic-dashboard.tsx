/**
 * Basic Dashboard Example
 *
 * Demonstrates rendering a reconciliation dashboard with transactions,
 * exceptions, and metrics.
 */

import React from "react";
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard,
} from "@settler/react-settler";
import type { ReconciliationTransaction, ReconciliationException } from "@settler/react-settler";

export function BasicDashboard() {
  // Sample transaction data
  const transactions: ReconciliationTransaction[] = [
    {
      id: "tx-1",
      provider: "stripe",
      providerTransactionId: "ch_1234567890",
      amount: { value: 100.0, currency: "USD" },
      currency: "USD",
      date: "2024-01-15T10:30:00Z",
      status: "succeeded",
      referenceId: "order-123",
    },
    {
      id: "tx-2",
      provider: "stripe",
      providerTransactionId: "ch_0987654321",
      amount: { value: 250.5, currency: "USD" },
      currency: "USD",
      date: "2024-01-15T11:45:00Z",
      status: "succeeded",
      referenceId: "order-124",
    },
    {
      id: "tx-3",
      provider: "paypal",
      providerTransactionId: "PAY-5YK922393D847794Y",
      amount: { value: 75.0, currency: "USD" },
      currency: "USD",
      date: "2024-01-15T14:20:00Z",
      status: "succeeded",
      referenceId: "order-125",
    },
  ];

  // Sample exception data
  const exceptions: ReconciliationException[] = [
    {
      id: "exc-1",
      category: "amount_mismatch",
      severity: "high",
      description: "Transaction tx-1 amount ($100.00) does not match settlement amount ($99.50)",
      transactionId: "tx-1",
      resolutionStatus: "open",
      createdAt: "2024-01-15T12:00:00Z",
    },
    {
      id: "exc-2",
      category: "date_mismatch",
      severity: "medium",
      description: "Settlement date is 3 days later than expected",
      transactionId: "tx-2",
      resolutionStatus: "in_progress",
      createdAt: "2024-01-15T13:00:00Z",
    },
  ];

  return (
    <ReconciliationDashboard>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <MetricCard title="Total Transactions" value={transactions.length} />
        <MetricCard title="Match Rate" value="95%" subtitle="19 of 20 matched" trend="up" />
        <MetricCard
          title="Exceptions"
          value={exceptions.length}
          subtitle="Requiring review"
          trend="neutral"
        />
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Transactions</h2>
        <TransactionTable
          transactions={transactions}
          onSelect={(tx) => console.log("Selected transaction:", tx)}
        />
      </div>

      <div>
        <h2>Exceptions</h2>
        <ExceptionTable
          exceptions={exceptions}
          onResolve={(exc) => console.log("Resolving exception:", exc)}
        />
      </div>
    </ReconciliationDashboard>
  );
}
