"use client";

import React from "react";
import { Fingerprint, Scale, ChevronDown, BarChart, Globe, AlertTriangle } from "lucide-react";

const RulesEditor: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 space-y-6">
        {/* Intro / Context */}
        <div>
          <h2 className="text-white text-xl font-bold mb-1">Matching Logic</h2>
          <p className="text-text-secondary text-sm">
            Define how transactions from external gateways are reconciled with internal ledgers.
          </p>
        </div>
        {/* Active Rules List */}
        <div className="space-y-4">
          {/* Card 1: Collapsed */}
          <div className="bg-surface-dark border border-border-dark rounded-xl p-4 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background-dark text-blue-400">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Transaction ID Match</h3>
                  <p className="text-text-secondary text-xs">Exact match on unique identifiers</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          {/* Card 2: Expanded (The focus of the editor) */}
          <div className="bg-surface-dark border border-primary/50 ring-1 ring-primary/20 rounded-xl overflow-hidden shadow-lg shadow-black/20">
            {/* Card Header */}
            <div className="p-4 border-b border-border-dark bg-surface-dark flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">
                    Amount &amp; Date Fuzzy Match
                  </h3>
                  <p className="text-text-secondary text-xs">Heuristic matching for exceptions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            {/* Editor Body */}
            <div className="p-4 space-y-6 bg-[#15202b]">
              {/* Logic Builder */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-text-secondary font-bold">
                  Core Logic
                </h4>
                {/* Source Field */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">
                      Source Field
                    </label>
                    <div className="relative">
                      <select className="w-full bg-background-dark text-sm text-white border border-border-dark rounded-lg py-2.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                        <option>gateway_amt</option>
                        <option>gateway_id</option>
                        <option>settlement_date</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 w-16">
                    <label className="text-[10px] text-text-secondary uppercase text-center block">
                      Op
                    </label>
                    <div className="relative">
                      <div className="w-full bg-surface-dark text-sm text-primary font-bold border border-border-dark rounded-lg py-2.5 text-center flex items-center justify-center">
                        ≈
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">
                      Target Field
                    </label>
                    <div className="relative">
                      <select className="w-full bg-background-dark text-sm text-white border border-border-dark rounded-lg py-2.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                        <option>ledger_amt</option>
                        <option>internal_id</option>
                        <option>posting_date</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Tolerances */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-text-secondary font-bold">
                  Tolerances
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Currency Variance */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-text-secondary">Max Variance (USD)</label>
                    <div className="relative group">
                      <input
                        className="w-full bg-background-dark text-white text-sm border border-border-dark rounded-lg py-2.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary"
                        step="0.01"
                        type="number"
                        defaultValue="0.05"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                        $
                      </span>
                    </div>
                  </div>
                  {/* Time Window */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-text-secondary">Time Window (Sec)</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                        ±
                      </div>
                      <input
                        className="w-full bg-background-dark text-white text-sm border border-border-dark rounded-lg py-2.5 pl-6 pr-3 focus:ring-1 focus:ring-primary focus:border-primary"
                        type="number"
                        defaultValue="120"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Impact Preview Button */}
              <button className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 border-dashed rounded-lg py-3 transition-colors group">
                <BarChart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Preview Impact on 30d History</span>
              </button>
            </div>
            {/* Debug Footer inside Card */}
            <div className="bg-background-dark p-2 border-t border-border-dark flex justify-between items-center px-4">
              <span className="text-[10px] font-mono text-text-secondary/50">
                TRACE: 8a9f-4b2c-9d1e
              </span>
              <span className="text-[10px] text-primary/70">v2.4 (Draft)</span>
            </div>
          </div>
          {/* Card 3: Collapsed */}
          <div className="bg-surface-dark border border-border-dark rounded-xl p-4 transition-all duration-200 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background-dark text-text-secondary">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Cross-Region Settlement</h3>
                  <p className="text-text-secondary text-xs">Multi-currency handling</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" value="" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        {/* Audit Section */}
        <div className="pt-4 border-t border-border-dark">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <h3 className="text-white text-sm font-bold">Deployment Audit</h3>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">
              Reason for change (Required for deployment)
            </label>
            <textarea
              className="w-full h-24 bg-surface-dark text-white text-sm border border-border-dark rounded-xl p-3 focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder-text-secondary/30"
              placeholder="e.g. Jira-123: Adjusting fuzzy match window to account for new gateway latency..."
            ></textarea>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">
              Draft Mode
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-400/10 px-2 py-1 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-400/20">
              Config ID: 9921
            </span>
          </div>
        </div>
        {/* Spacer for floating bar */}
        <div className="h-20"></div>
      </div>
    </main>
  );
};

export default RulesEditor;
