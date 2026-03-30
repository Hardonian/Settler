import React from "react";
import { notFound } from "next/navigation";
import AppPageLayout from "@/components/AppPageLayout";
import { getSourceTransactions, getTargetTransactions } from "@/app/demo/lib/data/loader";
import { matchTransactions, DEFAULT_RULES } from "@/lib/reconciliation/match-engine";
import MatchDetailView from "./MatchDetailView"; // Extracted client component for interactivity
import { prisma } from "@/shared/db/prismaClient";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = params;

  // 1. Fetch from canonical data source (demo loader acts as fallback API for now)
  const sourceTxs = getSourceTransactions();
  const targetTxs = getTargetTransactions();

  // Find the requested record
  const sourceWrap = sourceTxs.find((t) => t.id === id);
  if (!sourceWrap) {
    notFound();
  }

  // 2. Perform canonical Match in memory (since we haven't fully ingested these rows natively yet)
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

  // Find canonical outcomes across all to respect deterministic engine
  const matches = matchTransactions(mappedSource, mappedTarget, DEFAULT_RULES);
  const matchResult = matches.find((m) => m.sourceTransactionId === id);

  // Isolate targeted potential matches
  const potentialTargets = mappedTarget.filter(
    (t) => Math.abs(t.amount - sourceWrap.amount) <= DEFAULT_RULES.amountTolerance!
  );

  // 3. Look up persisted Review Actions / Modifications in the ledger to see if it's already accepted or rewritten
  let reviewState = null;
  try {
    reviewState = await prisma.reconciliationMatch.findFirst({
      where: { sourceTransactionId: id },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Ledger lookup failed (expected during local start without schema)", e);
  }

  return (
    <AppPageLayout
      title={`Reconciliation Detail: ${id.substring(0, 8)}`}
      description="Inspect source and destination match parity to verify intent."
    >
      <MatchDetailView
        sourceId={id}
        sourceTx={sourceWrap}
        matchResult={matchResult}
        potentialTargets={potentialTargets}
        reviewState={reviewState}
      />
    </AppPageLayout>
  );
}
