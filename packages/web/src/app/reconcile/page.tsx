"use client";

import React, { useMemo } from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import QueueTable, { type QueueItem } from "@/components/QueueTable";

// Pull deterministic matching engine to ensure structural parity
import { getSourceTransactions, getTargetTransactions } from "@/app/demo/lib/data/loader";
import { matchTransactions, DEFAULT_RULES } from "@/lib/reconciliation/match-engine";

export default function ReconcilePage() {
  const sourceTxs = useMemo(() => getSourceTransactions(), []);
  const targetTxs = useMemo(() => getTargetTransactions(), []);

  // Map to engine-compatible format
  const mappedSource = useMemo(
    () =>
      sourceTxs.map((t) => ({
        id: t.id,
        amount: t.amount,
        date: new Date(t.timestamp),
        description:
          "description" in t && typeof t.description === "string" ? t.description : t.source,
        currency: t.currency || "usd",
        original: t,
      })),
    [sourceTxs]
  );

  const mappedTarget = useMemo(
    () =>
      targetTxs.map((t) => ({
        id: t.id,
        amount: t.amount,
        date: new Date(t.timestamp),
        description:
          "description" in t && typeof t.description === "string" ? t.description : t.source,
        currency: t.currency || "usd",
        original: t,
      })),
    [targetTxs]
  );

  // Execute canonical matching to enforce evidence parity
  const matchResults = useMemo(() => {
    return matchTransactions(mappedSource, mappedTarget, DEFAULT_RULES);
  }, [mappedSource, mappedTarget]);

  const matchedCount = matchResults.filter((m) => m.matchType !== "unmatched").length;
  const unmatchedCount = matchResults.filter((m) => m.matchType === "unmatched").length;
  const totalVolume = mappedSource.length;

  const queueItems = useMemo<QueueItem[]>(() => {
    const unmatched = matchResults.filter((m) => m.matchType === "unmatched");
    return unmatched.map((result) => {
      const sourceWrap = mappedSource.find((s) => s.id === result.sourceTransactionId);
      const original = sourceWrap?.original;

      const dateStr = original?.timestamp
        ? new Date(original.timestamp).toISOString().split("T")[0]
        : "Unknown";

      return {
        id: result.sourceTransactionId,
        date: dateStr,
        vendor: sourceWrap?.description || "Unknown",
        amount: sourceWrap ? `$${sourceWrap.amount.toFixed(2)}` : "$0.00",
        status: "Review",
        source: original?.source || "unknown",
      };
    });
  }, [matchResults, mappedSource]);

  return (
    <AppPageLayout
      title="Reconciliation Dashboard"
      description="Review and process matches between your ledger and uploaded receipts."
    >
      <div className="space-y-8">
        <section>
          <ReconciliationPanel
            matchedCount={matchedCount}
            unmatchedCount={unmatchedCount}
            totalVolume={totalVolume}
          />
        </section>
        <section>
          <QueueTable items={queueItems} />
        </section>
      </div>
    </AppPageLayout>
  );
}
