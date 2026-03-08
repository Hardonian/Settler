"use client";

import { Filter, AlertTriangle, Pencil, Check } from "lucide-react";
import ReviewQueue from "@/components/stitch-import/ReviewQueue";
import ReasonForChangeModal from "@/components/stitch-import/ReasonForChangeModal";

export default function ReviewPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden flex flex-col h-screen">
      <header className="bg-surface-darker border-b border-border-dark px-4 py-3 flex items-center justify-between z-10">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white tracking-tight">Review Queue</h1>
          <span className="text-xs text-slate-400">12 Pending Reconciliation</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-border-dark/50 text-slate-300 hover:text-white transition-colors">
          <Filter className="h-6 w-6" />
        </button>
      </header>
      <ReviewQueue />
      <div className="fixed bottom-0 left-0 w-full bg-surface-darker/90 backdrop-blur-md border-t border-border-dark pb-6 pt-3 px-4 z-20">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <button className="flex flex-col items-center justify-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center group-hover:bg-accent-warning/20 group-hover:border-accent-warning/50 transition-all group-active:scale-95">
              <AlertTriangle className="h-6 w-6 text-slate-300 group-hover:text-accent-warning" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200">
              Exception
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center group-hover:bg-white/10 transition-all group-active:scale-95">
              <Pencil className="h-6 w-6 text-slate-300 group-hover:text-white" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200">
              Override
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 group col-span-1">
            <div className="w-full h-12 px-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:bg-primary-dark transition-all group-active:scale-95">
              <Check className="h-6 w-6 text-white mr-1" />
              <span className="text-sm font-bold text-white">Match</span>
            </div>
            <span className="text-[10px] font-medium text-transparent select-none">.</span>{" "}
            {/* Spacing hack */}
          </button>
        </div>
      </div>
      <ReasonForChangeModal />
    </div>
  );
}
