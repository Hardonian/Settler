"use strict";

import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ReconciliationPanel from "@/components/ReconciliationPanel";
import QueueTable from "@/components/QueueTable";

export default function ReconcilePage() {
  return (
    <AppPageLayout
      title="Reconciliation Dashboard"
      description="Review and process matches between your ledger and uploaded receipts."
    >
      <div className="space-y-8">
        <section>
          <ReconciliationPanel />
        </section>
        <section>
          <QueueTable />
        </section>
      </div>
    </AppPageLayout>
  );
}
