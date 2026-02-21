"use client";

import React from "react";
import AppPageLayout from "@/components/AppPageLayout";
import ReceiptParser from "@/components/ReceiptParser";

export default function ParserPage() {
  return (
    <AppPageLayout
      title="Receipt Parser"
      description="Extract financial entities from raw documents with high-precision AI."
    >
      <div className="space-y-8">
        <ReceiptParser />
      </div>
    </AppPageLayout>
  );
}
