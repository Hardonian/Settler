"use client";

import React, { useState } from "react";

const ReceiptParser: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState({
    vendor: "Blue Bottle Coffee",
    date: "2024-02-15",
    amount: "12.50",
    tax: "1.02",
    confidence: 0.98,
    file: "receipt_001.pdf"
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      {/* Upload Area */}
      <div className="lg:col-span-1 rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-center bg-neutral-10/30 hover:border-teal-500/50 transition-colors cursor-pointer group">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">Click to upload</h4>
        <p className="text-xs text-muted px-4">PDF, PNG, JPG (Max 10MB). Multi-page receipts supported.</p>
        <button className="mt-6 px-4 py-1.5 text-xs font-semibold bg-neutral-30 text-foreground rounded-md hover:bg-teal-500 hover:text-white transition-all">
          Select Files
        </button>
      </div>

      {/* Extracted Fields Preview */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Extracted Data</h3>
            <span className="text-xs font-mono text-muted bg-neutral-20 px-2 py-0.5 rounded">
              {extractedData.file}
            </span>
          </div>
          {/* Confidence Score Chip */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Confidence:</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              extractedData.confidence > 0.9 ? 'bg-teal-500/10 text-teal-500' : 'bg-warning/10 text-warning'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${extractedData.confidence > 0.9 ? 'bg-teal-500' : 'bg-warning'}`} />
              {(extractedData.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8 flex-1">
          <div className="space-y-1.5">
            <label htmlFor="vendor" className="text-[10px] uppercase font-bold text-muted tracking-wider">Vendor</label>
            <input
              id="vendor"
              readOnly
              value={extractedData.vendor}
              className="w-full bg-neutral-10 border-b border-border py-1 text-sm text-foreground focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="date" className="text-[10px] uppercase font-bold text-muted tracking-wider">Date</label>
            <input
              id="date"
              readOnly
              value={extractedData.date}
              className="w-full bg-neutral-10 border-b border-border py-1 text-sm text-foreground focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-[10px] uppercase font-bold text-muted tracking-wider">Total Amount</label>
            <div className="relative">
               <span className="absolute left-0 top-1 text-sm text-muted">$</span>
               <input
                id="amount"
                readOnly
                value={extractedData.amount}
                className="w-full bg-neutral-10 border-b border-border py-1 pl-4 text-sm text-foreground focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tax" className="text-[10px] uppercase font-bold text-muted tracking-wider">Tax</label>
            <div className="relative">
               <span className="absolute left-0 top-1 text-sm text-muted">$</span>
               <input
                id="tax"
                readOnly
                value={extractedData.tax}
                className="w-full bg-neutral-10 border-b border-border py-1 pl-4 text-sm text-foreground focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={() => setIsUploading(false)}
            className="text-xs text-muted hover:text-error transition-colors font-medium">
            Discard
          </button>
          <button
            type="button"
            onClick={() => setExtractedData({...extractedData, confidence: 1.0})}
            className="px-5 py-2 text-sm font-semibold bg-teal-500 text-white rounded-md hover:bg-teal-600 shadow-sm">
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptParser;
