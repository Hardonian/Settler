"use client";

import React from "react";
import { Filter, PlusCircle, FileCheck, Scale, Clock } from "lucide-react";

const PolicyViewer: React.FC = () => {
  return (
    <section className="px-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
          RLS Policies
        </h3>
        <div className="flex gap-2">
          <Filter className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark cursor-pointer" />
          <PlusCircle className="h-5 w-5 text-text-muted-light dark:text-text-muted-dark cursor-pointer" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {/* Policy Item 1 */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-blue-500/10 text-blue-500">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                Transaction_View
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-mono">
                  public.transactions
                </p>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            SELECT
          </span>
        </div>
        {/* Policy Item 2 */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                Settlement_Approve
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-mono">
                  restricted.approvals
                </p>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
            UPDATE
          </span>
        </div>
        {/* Policy Item 3 */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-3 flex items-center justify-between opacity-60">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-slate-500/10 text-slate-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                Audit_Write
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark font-mono">
                  system.logs
                </p>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            INSERT
          </span>
        </div>
      </div>
    </section>
  );
};

export default PolicyViewer;
