"use client";

import React, { useState } from "react";

const ExportPreview: React.FC = () => {
  const [format, setFormat] = useState<"json" | "csv">("json");

  const jsonExample = `[
  {
    "id": "TX-9041",
    "vendor": "Amazon.com",
    "amount": 452.12,
    "currency": "USD",
    "category": "Office Supplies",
    "status": "reconciled"
  },
  {
    "id": "TX-9042",
    "vendor": "Stripe",
    "amount": 1200.00,
    "currency": "USD",
    "category": "Income",
    "status": "verified"
  }
]`;

  const csvExample = `id,vendor,amount,currency,category,status
TX-9041,Amazon.com,452.12,USD,Office Supplies,reconciled
TX-9042,Stripe,1200.00,USD,Income,verified`;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-border flex items-center justify-between bg-neutral-10/30">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Export Manager</h3>
          <p className="text-sm text-muted">Generate audit-ready files for accounting.</p>
        </div>
        <div className="flex bg-neutral-20 p-1 rounded-lg">
          <button
            onClick={() => setFormat("json")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${format === 'json' ? 'bg-card text-teal-500 shadow-sm' : 'text-muted hover:text-foreground'}`}>
            JSON
          </button>
          <button
            onClick={() => setFormat("csv")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${format === 'csv' ? 'bg-card text-teal-500 shadow-sm' : 'text-muted hover:text-foreground'}`}>
            CSV
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="p-6 overflow-x-auto max-h-[400px]">
          <pre className="text-xs font-mono text-muted leading-relaxed whitespace-pre">
            {format === 'json' ? jsonExample : csvExample}
          </pre>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />

        <button className="absolute bottom-6 right-6 px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-md shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all">
          Download {format.toUpperCase()}
        </button>
      </div>

      <div className="p-4 border-t border-border flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-teal-500 focus:ring-teal-500 bg-neutral-10" />
          <span className="text-xs text-muted">Include Receipt Images</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-teal-500 focus:ring-teal-500 bg-neutral-10" />
          <span className="text-xs text-muted">Anonymize Sensitive Data</span>
        </label>
      </div>
    </div>
  );
};

export default ExportPreview;
