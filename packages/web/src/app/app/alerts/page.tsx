import React from "react";
import {
  Search,
  AlertCircle,
  Server,
  ListChecks,
  BellOff,
  AlertTriangle,
  Building,
  BookOpen,
  Info,
  FileText,
  Download,
  Lock,
} from "lucide-react";

const AlertsPage: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased selection:bg-primary/30">
      {/* Header Area */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 pt-12 pb-4 px-4 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-dark">Settler Reconciliation</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-200 dark:bg-surface-dark overflow-hidden flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-medium">
                  UA
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Global Status Summary */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 min-w-[140px] flex-1">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <div>
              <span className="block text-2xl font-bold text-danger leading-none">2</span>
              <span className="text-xs font-medium text-danger/80 uppercase tracking-wider">
                Critical
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20 min-w-[140px] flex-1">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <div>
              <span className="block text-2xl font-bold text-warning leading-none">5</span>
              <span className="text-xs font-medium text-warning/80 uppercase tracking-wider">
                Warning
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 min-w-[140px] flex-1">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div>
              <span className="block text-2xl font-bold text-primary leading-none">12</span>
              <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">
                Info
              </span>
            </div>
          </div>
        </div>
      </header>
      {/* Filter Bar (Sticky below header) */}
      <div className="sticky top-[164px] z-40 bg-background-light dark:bg-background-dark pt-2 pb-4 px-4 border-b border-transparent">
        <div className="flex p-1 bg-slate-200 dark:bg-surface-dark rounded-lg">
          <button className="flex-1 py-1.5 px-3 rounded-md text-sm font-medium bg-white dark:bg-surface-highlight text-primary shadow-sm transition-all">
            Open (14)
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-dark hover:text-slate-900 dark:hover:text-slate-100 transition-all">
            Ack (4)
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-dark hover:text-slate-900 dark:hover:text-slate-100 transition-all">
            Resolved
          </button>
        </div>
      </div>
      {/* Main Content: Alert Feed */}
      <main className="flex-1 px-4 pb-24 space-y-4 pt-2">
        {/* Alert Card 1: Critical (Swipeable hint visual) */}
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5 active:scale-[0.98] transition-transform duration-200">
          {/* Left border indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-danger"></div>
          <div className="p-4 pl-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-danger" />
                <span className="text-xs font-bold text-danger uppercase tracking-wider">
                  Critical
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-neutral-dark font-mono">
                2m ago
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight mb-1 text-slate-900 dark:text-slate-100">
              Payment Gateway Timeout - 500 Error
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-dark mb-4">
              <Server className="h-4 w-4" />
              <span>api-gateway</span>
              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
              <span>us-east-1</span>
            </div>
            {/* Technical Badge */}
            <div className="flex items-center justify-between mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 text-primary text-xs font-mono font-medium border border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors">
                <ListChecks className="h-3.5 w-3.5" />
                TRC-9928-X
              </span>
              {/* Quick Actions visible on card */}
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-neutral-dark hover:text-slate-900 dark:hover:text-white transition-colors">
                  <BellOff className="h-5 w-5" />
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors">
                  Ack
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Alert Card 2: Warning (Expanded view concept) */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-warning"></div>
          <div className="p-4 pl-5 border-l-[6px] border-warning">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-xs font-bold text-warning uppercase tracking-wider">
                  Warning
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-neutral-dark font-mono">
                15m ago
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight mb-1 text-slate-900 dark:text-slate-100">
              Reconciliation Delay &gt; 5m
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-dark mb-3">
              <Building className="h-4 w-4" />
              <span>ledger-service</span>
            </div>
            {/* Expanded Details Section */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-surface-dark bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-medium">
                    JD
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-surface-dark bg-slate-200 dark:bg-surface-highlight flex items-center justify-center text-[10px] text-slate-500">
                    +1
                  </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-neutral-dark">
                  Acknowledged by{" "}
                  <span className="text-slate-900 dark:text-slate-200 font-medium">Jane Doe</span>
                </span>
              </div>
              {/* Mini Timeline */}
              <div className="relative pl-3 space-y-4 mb-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-slate-200 dark:before:bg-white/10">
                <div className="relative pl-4">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20"></div>
                  <p className="text-xs text-slate-500 dark:text-neutral-dark leading-tight">
                    Alert triggered based on <span className="font-mono">thresh_latency_high</span>
                  </p>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20"></div>
                  <p className="text-xs text-slate-900 dark:text-slate-200 font-medium leading-tight">
                    Runbook suggestion: Check DB locks
                  </p>
                  <button className="mt-2 flex items-center gap-1.5 text-primary text-xs font-medium hover:underline">
                    <BookOpen className="h-3.5 w-3.5" />
                    View SOP-Ledger-04
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                  Escalate
                </button>
                <button className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Alert Card 3: Info */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5 active:scale-[0.98] transition-transform duration-200">
          <div className="p-4 pl-5 border-l-[6px] border-primary">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Info
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-neutral-dark font-mono">
                1h ago
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight mb-1 text-slate-900 dark:text-slate-100">
              Daily Settlement Report Generated
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-dark mb-3">
              <FileText className="h-4 w-4" />
              <span>reporting-service</span>
            </div>
            {/* Technical Badge */}
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-neutral-dark text-xs font-mono font-medium border border-slate-200 dark:border-white/5 hover:text-primary transition-colors">
                <Download className="h-3.5 w-3.5" />
                RPT-2023-10-24.pdf
              </span>
            </div>
          </div>
        </div>
        {/* Alert Card 4: Critical */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5 active:scale-[0.98] transition-transform duration-200 opacity-60">
          <div className="p-4 pl-5 border-l-[6px] border-danger">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-danger" />
                <span className="text-xs font-bold text-danger uppercase tracking-wider">
                  Critical
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-neutral-dark font-mono">
                3h ago
              </span>
            </div>
            <h3 className="text-base font-semibold leading-tight mb-1 text-slate-900 dark:text-slate-100 line-through decoration-slate-500">
              High Latency on Auth Service
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-dark">
              <Lock className="h-4 w-4" />
              <span>auth-service</span>
              <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Silenced
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlertsPage;
