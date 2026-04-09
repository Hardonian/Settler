/**
 * VirtualizedTable Component
 * High-performance virtualized table for large datasets
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
import { useFeatureGate, FEATURE_FLAGS } from "../utils/licensing";

import React, { useMemo, useCallback, useState } from "react";
import { useCompilationContext } from "../context";
import { ReconciliationTransaction } from "@settler/protocol";

export interface VirtualizedTableProps {
  transactions: ReconciliationTransaction[];
  height?: number;
  rowHeight?: number;
  onSelect?: (transaction: ReconciliationTransaction) => void;
  className?: string;
}

const DEFAULT_HEIGHT = 400;
const DEFAULT_ROW_HEIGHT = 50;

export function VirtualizedTable({
  transactions,
  height = DEFAULT_HEIGHT,
  rowHeight = DEFAULT_ROW_HEIGHT,
  onSelect,
  className,
}: VirtualizedTableProps) {
  const context = useCompilationContext();
  const { hasAccess, UpgradePrompt } = useFeatureGate(FEATURE_FLAGS.VIRTUALIZATION);
  const [scrollTop, setScrollTop] = useState(0);

  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(startIndex + Math.ceil(height / rowHeight) + 1, transactions.length);
    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, height, transactions.length]);

  const visibleTransactions = useMemo(() => {
    return transactions.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [transactions, visibleRange]);

  const totalHeight = transactions.length * rowHeight;
  const offsetY = visibleRange.startIndex * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // In config mode, register widget
  if (context.mode === "config") {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets["virtualized-table"] = {
      id: "virtualized-table",
      type: "transaction-table",
      props: { height, rowHeight },
    };
    return null;
  }

  // UI mode
  return (
    <div
      className={className}
      data-widget="virtualized-table"
      style={{
        height,
        overflow: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>
            <tr>
              <th
                style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}
              >
                ID
              </th>
              <th
                style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}
              >
                Provider
              </th>
              <th
                style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}
              >
                Amount
              </th>
              <th
                style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}
              >
                Date
              </th>
              <th
                style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleTransactions.map((tx, index) => (
              <tr
                key={tx.id}
                onClick={() => onSelect?.(tx)}
                style={{
                  cursor: onSelect ? "pointer" : "default",
                  backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <td style={{ padding: "0.75rem" }}>{tx.id}</td>
                <td style={{ padding: "0.75rem" }}>{tx.provider}</td>
                <td style={{ padding: "0.75rem" }}>
                  {tx.amount.value.toFixed(2)} {tx.amount.currency}
                </td>
                <td style={{ padding: "0.75rem" }}>{new Date(tx.date).toLocaleDateString()}</td>
                <td style={{ padding: "0.75rem" }}>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
