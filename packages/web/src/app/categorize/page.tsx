"use client";

import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import CategorizationStudio from "@/components/CategorizationStudio";

export default function CategorizePage() {
  return (
    <AppPageLayout
      title="Categorization Studio"
      description="Define rules and leverage AI to automatically categorize your financial data."
    >
      <div className="space-y-8">
        <CategorizationStudio />
      </div>
    </AppPageLayout>
  );
}
