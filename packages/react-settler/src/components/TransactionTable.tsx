/**
 * TransactionTable
 * Displays reconciliation transactions in a table format
 */

import React, { useMemo } from "react";
import { ReconciliationTransaction } from "@settler/protocol";
import { useCompilationContext } from "../context";
import { useTelemetry } from "../hooks/useTelemetry";
import { sanitizeString } from "@settler/protocol";

export interface TransactionTableProps {
  transactions: ReconciliationTransaction[];
  onSelect?: (transaction: ReconciliationTransaction) => void;
  className?: string;
  showProvider?: boolean;
  showStatus?: boolean;
}

export const TransactionTable = React.memo(function TransactionTable({
  transactions,
  onSelect,
  className,
  showProvider = true,
  showStatus = true,
}: TransactionTableProps) {
  const context = useCompilationContext();
  const { track } = useTelemetry("TransactionTable");

  // Memoize sanitized transactions
  const sanitizedTransactions = useMemo(() => {
    return transactions.map((tx) => ({
      ...tx,
      id: sanitizeString(tx.id),
      provider: sanitizeString(tx.provider),
      providerTransactionId: sanitizeString(tx.providerTransactionId),
      ...(tx.referenceId ? { referenceId: sanitizeString(tx.referenceId) } : {}),
    }));
  }, [transactions]);

  // In config mode, register widget
  if (context.mode === "config") {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets["transaction-table"] = {
      id: "transaction-table",
      type: "transaction-table",
      props: {
        showProvider,
        showStatus,
      },
    };
  }

  // In UI mode, render table
  if (context.mode === "ui") {
    return (
      <div className={className} data-widget="transaction-table">
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table
            role="table"
            aria-label="Reconciliation transactions"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  ID
                </th>
                {showProvider && (
                  <th
                    scope="col"
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: 600,
                      borderBottom: "2px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    Provider
                  </th>
                )}
                <th
                  scope="col"
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  Amount
                </th>
                <th
                  scope="col"
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  Currency
                </th>
                <th
                  scope="col"
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  Date
                </th>
                {showStatus && (
                  <th
                    scope="col"
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: 600,
                      borderBottom: "2px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sanitizedTransactions.map((tx, index) => (
                <tr
                  key={tx.id}
                  onClick={() => {
                    track("transaction.selected", { transactionId: tx.id });
                    onSelect?.(tx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      track("transaction.selected", { transactionId: tx.id });
                      onSelect?.(tx);
                    }
                  }}
                  role={onSelect ? "button" : "row"}
                  tabIndex={onSelect ? 0 : -1}
                  aria-label={`Transaction ${tx.id}, ${tx.amount.value} ${tx.amount.currency}`}
                  style={{
                    cursor: onSelect ? "pointer" : "default",
                    backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (onSelect) {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#f9fafb";
                  }}
                  onFocus={(e) => {
                    if (onSelect) {
                      e.currentTarget.style.outline = "2px solid #3b82f6";
                      e.currentTarget.style.outlineOffset = "-2px";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                  }}
                >
                  <td style={{ padding: "0.75rem" }}>{tx.id}</td>
                  {showProvider && <td style={{ padding: "0.75rem" }}>{tx.provider}</td>}
                  <td style={{ padding: "0.75rem" }}>{tx.amount.value.toFixed(2)}</td>
                  <td style={{ padding: "0.75rem" }}>{tx.currency}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <time dateTime={tx.date}>{new Date(tx.date).toLocaleDateString()}</time>
                  </td>
                  {showStatus && (
                    <td style={{ padding: "0.75rem" }}>
                      <span role="status" aria-label={`Status: ${tx.status}`}>
                        {tx.status}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sanitizedTransactions.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No transactions found
          </div>
        )}
      </div>
    );
  }

  // Config mode: return null (widget registered above)
  return null;
});
