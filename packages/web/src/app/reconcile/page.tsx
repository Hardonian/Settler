import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import QueueTable, { type QueueItem } from "@/components/QueueTable";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import { redirect } from "next/navigation";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Enforce Tenant Boundary
  const tenantId = user.id;

  let matches: any[] = [];
  try {
    matches = await prisma.reconciliationMatch.findMany({
      where: { tenantId },
      include: {
        sourceTransaction: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    appLogger.error("Failed to load matching data", error);
  }

  const matchedCount = matches.filter((m) => m.matchType !== "unmatched").length;
  const unmatchedCount = matches.filter((m) => m.matchType === "unmatched").length;
  const totalVolume = matches.length;

  // Build the Queue for unresolved exceptions
  const queueItems: QueueItem[] = matches
    .filter(
      (m) => m.matchType === "unmatched" && m.status !== "resolved" && m.status !== "dismissed"
    )
    .map((record) => {
      const source = record.sourceTransaction;

      const dateStr = source?.timestamp
        ? new Date(source.timestamp).toISOString().split("T")[0]
        : "Unknown";

      return {
        id: record.sourceTransactionId, // Ensure unique Queue item match logic
        date: dateStr,
        vendor: source?.description || "Unknown",
        amount: source ? `$${Number(source.amount).toFixed(2)}` : "$0.00",
        status: record.status === "open" ? "Review" : "Pending",
        source: source?.sourceType || "unknown",
      };
    });

  return (
    <AppPageLayout
      title="Reconciliation Dashboard"
      description="Review and process exceptions between your ledger and external evidence."
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
