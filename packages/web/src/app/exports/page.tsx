"use strict";

import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ExportPreview from "@/components/ExportPreview";

export default function ExportsPage() {
  return (
    <AppPageLayout
      title="Export Manager"
      description="Preview and download your reconciled data in multiple audit-ready formats."
    >
      <div className="space-y-8">
        <ExportPreview />
      </div>
    </AppPageLayout>
  );
}
