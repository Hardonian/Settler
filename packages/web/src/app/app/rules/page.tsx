"use client";

import { ArrowLeft, Clock, Rocket } from "lucide-react";
import RulesEditor from "@/components/stitch-import/RulesEditor";

export default function RulesPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-hidden">
      <header className="flex-none sticky top-0 z-50 bg-background-dark border-b border-border-dark pt-safe-top">
        <div className="flex items-center justify-between p-4 pb-3">
          <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              Rules &amp; Configuration
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-text-secondary text-xs font-medium">System Healthy • v2.3.1</p>
            </div>
          </div>
          <button className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-dark transition-colors">
            <Clock className="h-6 w-6" />
          </button>
        </div>
      </header>
      <RulesEditor />
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            disabled
          >
            <Rocket className="h-6 w-6" />
            Save &amp; Deploy v2.4
          </button>
        </div>
      </div>
    </div>
  );
}
