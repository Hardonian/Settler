"use client";

import React from "react";
import { AlertTriangle, Fingerprint, AlertCircle, Info } from "lucide-react";

const ReviewQueue: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
      {/* Triage Carousel (Horizontal Scroll) */}
      <div className="pt-4 pb-2">
        <div className="px-4 mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queue</h2>
          <span className="text-xs text-primary cursor-pointer hover:underline">View All</span>
        </div>
        <div className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar snap-x snap-mandatory">
          {/* Card 1 (Active) */}
          <div className="snap-center shrink-0 w-[85%] bg-surface-dark border border-primary/50 shadow-[0_0_15px_rgba(19,127,236,0.15)] rounded-xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-danger animate-pulse"></span>
                <span className="text-xs font-mono text-muted-foreground">REC-9021</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-danger/20 text-accent-danger border border-accent-danger/30">
                HIGH SEVERITY
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">Discrepancy</p>
                <p className="text-xl font-bold text-white font-mono">$4,500.00</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <div className="flex items-center gap-1 text-accent-warning text-xs font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Low Match</span>
                </div>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="snap-center shrink-0 w-[85%] bg-surface-dark border border-border-dark rounded-xl p-4 relative overflow-hidden opacity-60 scale-95">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-warning"></span>
                <span className="text-xs font-mono text-muted-foreground">REC-9022</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-warning/20 text-accent-warning border border-accent-warning/30">
                MEDIUM
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">Discrepancy</p>
                <p className="text-xl font-bold text-white font-mono">$120.50</p>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="snap-center shrink-0 w-[85%] bg-surface-dark border border-border-dark rounded-xl p-4 relative overflow-hidden opacity-60 scale-95">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span className="text-xs font-mono text-muted-foreground">REC-9023</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-slate-600">
                LOW
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">Discrepancy</p>
                <p className="text-xl font-bold text-white font-mono">$0.05</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Evidence Viewer (Detail Section) */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Evidence Viewer</h2>
          <div
            className="flex items-center gap-1.5 px-2 py-1 bg-surface-dark rounded text-xs text-muted-foreground border border-border-dark cursor-copy"
            title="Copy Trace ID"
          >
            <Fingerprint className="h-3.5 w-3.5" />
            <span className="font-mono">8a9f-2b3c...</span>
          </div>
        </div>
        {/* Comparison Table */}
        <div className="bg-surface-dark rounded-lg border border-border-dark overflow-hidden">
          {/* Headers */}
          <div className="grid grid-cols-2 divide-x divide-border-dark bg-surface-darker border-b border-border-dark">
            <div className="p-3 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Source A (ERP)
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Source B (Bank)
              </p>
            </div>
          </div>
          {/* Row 1: Match */}
          <div className="grid grid-cols-2 divide-x divide-border-dark border-b border-border-dark/50 hover:bg-card/5 transition-colors">
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Transaction ID</p>
              <p className="text-sm font-mono text-muted-foreground truncate">TX_99283811</p>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Transaction ID</p>
              <p className="text-sm font-mono text-muted-foreground truncate">TX_99283811</p>
            </div>
          </div>
          {/* Row 2: Mismatch (Highlighted) */}
          <div className="grid grid-cols-2 divide-x divide-border-dark border-b border-border-dark/50 bg-accent-danger/5 relative">
            {/* Mismatch Indicator Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-danger"></div>
            <div className="p-3 relative">
              <p className="text-[10px] text-muted-foreground mb-0.5">Amount</p>
              <p className="text-sm font-mono font-bold text-muted-foreground">500.00</p>
            </div>
            <div className="p-3 bg-accent-danger/10">
              <p className="text-[10px] text-accent-danger/80 mb-0.5 font-bold">
                Amount (Mismatch)
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono font-bold text-white">5,000.00</p>
                <AlertCircle className="h-4 w-4 text-accent-danger" />
              </div>
            </div>
          </div>
          {/* Row 3: Match */}
          <div className="grid grid-cols-2 divide-x divide-border-dark border-b border-border-dark/50 hover:bg-card/5 transition-colors">
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Currency</p>
              <p className="text-sm font-mono text-muted-foreground">USD</p>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Currency</p>
              <p className="text-sm font-mono text-muted-foreground">USD</p>
            </div>
          </div>
          {/* Row 4: Match */}
          <div className="grid grid-cols-2 divide-x divide-border-dark hover:bg-card/5 transition-colors">
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Date</p>
              <p className="text-sm font-mono text-muted-foreground">2023-10-24</p>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Date</p>
              <p className="text-sm font-mono text-muted-foreground">2023-10-24</p>
            </div>
          </div>
        </div>
        {/* Context Box */}
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex gap-3 items-start">
          <Info className="h-6 w-6 text-primary mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">AI Insight</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The discrepancy appears to be a decimal placement error (10x difference).
              Historically, manual overrides favor Source B for this vendor.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReviewQueue;
