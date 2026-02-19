"use strict";

import React from "react";

const CategorizationStudio: React.FC = () => {
  const suggestedRules = [
    { id: 1, type: "Vendor", match: "AWS", category: "Infrastructure", confidence: 0.99 },
    { id: 2, type: "Pattern", match: "*-NYC-TAXI", category: "Travel", confidence: 0.94 },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Editor Skeleton */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-foreground">Rule Editor</h3>
            <button className="text-xs font-semibold text-teal-500 hover:text-teal-400">+ New Rule</button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted uppercase">If Statement</label>
                <select className="w-full bg-neutral-10 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-teal-500">
                  <option>Vendor Name</option>
                  <option>Amount</option>
                  <option>Description Pattern</option>
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Operator</label>
                <select className="w-full bg-neutral-10 border border-border rounded-md px-3 py-2 text-sm text-foreground">
                  <option>contains</option>
                  <option>matches exactly</option>
                  <option>is greater than</option>
                </select>
              </div>
              <div className="flex-[2] space-y-2">
                <label className="text-xs font-bold text-muted uppercase">Value</label>
                <input type="text" placeholder="e.g. AWS" className="w-full bg-neutral-10 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-teal-500" />
              </div>
            </div>

            <div className="flex gap-4 items-center py-4 justify-center text-muted">
              <div className="h-px flex-1 bg-border/50"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">then assign</span>
              <div className="h-px flex-1 bg-border/50"></div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">Category</label>
              <div className="flex gap-3">
                <select className="flex-1 bg-neutral-10 border border-border rounded-md px-3 py-2 text-sm text-foreground">
                  <option>Infrastructure</option>
                  <option>Marketing</option>
                  <option>Operations</option>
                  <option>Travel</option>
                </select>
                <button className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-md text-sm hover:bg-teal-600 shadow-sm shadow-teal-500/10">
                  Apply Rule
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestion Panel */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-neutral-10/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">AI Suggestions</h3>
          </div>

          <div className="space-y-4 flex-1">
            {suggestedRules.map(rule => (
              <div key={rule.id} className="p-4 rounded-lg bg-card border border-border/50 hover:border-blue-400/30 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{rule.type} Match</span>
                  <span className="text-[10px] text-muted font-mono">{(rule.confidence * 100).toFixed(0)}% Match</span>
                </div>
                <p className="text-xs text-foreground font-medium mb-1">
                  Assign <span className="text-teal-500">{rule.match}</span> to <span className="text-teal-500">{rule.category}</span>
                </p>
                <div className="flex justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-bold text-muted hover:text-foreground">Ignore</button>
                  <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300">Accept</button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[10px] text-muted text-center leading-relaxed">
            AI suggestions improve as you process more transactions manually. Verified rules are automatically promoted to active ruleset.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategorizationStudio;
