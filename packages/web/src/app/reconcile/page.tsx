import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import QueueTable, { type QueueItem } from "@/components/QueueTable";

// Pull deterministic matching engine to ensure structural parity
import { getSourceTransactions, getTargetTransactions } from "@/app/demo/lib/data/loader";
import { matchTransactions, DEFAULT_RULES } from "@/lib/reconciliation/match-engine";

// DB Access
import { prisma } from "@/shared/db/prismaClient";

export default async function ReconcilePage() {
  const sourceTxs = getSourceTransactions();
  const targetTxs = getTargetTransactions();

  // Map to engine-compatible format
  const mappedSource = sourceTxs.map((t) => ({
    id: t.id,
    amount: t.amount,
    date: new Date(t.timestamp),
    description: "description" in t && typeof t.description === "string" ? t.description : t.source,
    currency: t.currency || "usd",
    original: t,
  }));

  const mappedTarget = targetTxs.map((t) => ({
    id: t.id,
    amount: t.amount,
    date: new Date(t.timestamp),
    description: "description" in t && typeof t.description === "string" ? t.description : t.source,
    currency: t.currency || "usd",
    original: t,
  }));

  // Execute canonical matching to enforce evidence parity
  const matchResults = matchTransactions(mappedSource, mappedTarget, DEFAULT_RULES);

  // Fetch ledger persisted resolutions (Accepted / Overridden / Modified)
  let persistedReviews: Record<string, string> = {};
  try {
    const reviews = await prisma.reconciliationMatch.findMany({
      where: {
        sourceTransactionId: { in: mappedSource.map(s => s.id) }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Pick the most recent status for each item
    for (const r of reviews) {
      if (!persistedReviews[r.sourceTransactionId] && r.status !== 'open') {
        persistedReviews[r.sourceTransactionId] = r.status;
      }
    }
  } catch (error) {
    console.warn("Could not load persisted reviews (acceptable if first run demo)", error);
  }

  const matchedCount = matchResults.filter((m) => m.matchType !== "unmatched").length;
  const unmatchedCount = matchResults.filter((m) => m.matchType === "unmatched").length;
  const totalVolume = mappedSource.length;

  // For the QueueTable, we map the unmatched/unresolved items
  const queueItems: QueueItem[] = matchResults
    .filter((m) => m.matchType === "unmatched")
    .map((result) => {
      const sourceWrap = mappedSource.find((s) => s.id === result.sourceTransactionId);
      const original = sourceWrap?.original;

      const dateStr = original?.timestamp
        ? new Date(original.timestamp).toISOString().split("T")[0] || "Unknown"
        : "Unknown";

      // Re-map Review status if operator persisted a resolution
      const ledgerStatus = persistedReviews[result.sourceTransactionId];
      const statusLabel = ledgerStatus === "resolved" 
        ? "Pending" // A resolved exception may drop or go to a different queue actually. Let's filter it out.
        : ledgerStatus === "dismissed" 
          ? "Filtered" 
          : "Review";

      return {
        id: result.sourceTransactionId,
        date: dateStr,
        vendor: sourceWrap?.description || "Unknown",
        amount: sourceWrap ? \`$\${sourceWrap.amount.toFixed(2)}\` : "$0.00",
        status: statusLabel,
        source: original?.source || "unknown",
      };
    })
    // For pure reconciliation queue logic, you'd hide resolved ones completely:
    .filter(q => q.status === "Review" || q.status === "Scanning" || q.status === "Pending") as QueueItem[];

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
