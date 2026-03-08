import React from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Lock,
  Eye,
  Zap,
  Wrench,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

const TransparencyDashboard: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-x-hidden antialiased">
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 pb-3 justify-between">
          <button className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            Transparency
          </h2>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="@container p-4">
            <div className="relative flex min-h-[400px] flex-col gap-6 rounded-2xl overflow-hidden p-6 items-start justify-end shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40"></div>
              <div className="relative z-10 flex flex-col gap-2 text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white w-fit mb-2 border border-white/30">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Deterministic Logic</span>
                </div>
                <h1 className="text-white text-3xl font-black leading-tight tracking-tight">
                  Deterministic by Design
                </h1>
                <p className="text-slate-100 text-sm font-medium leading-relaxed opacity-90">
                  How we settle your data. 100% Deterministic. Zero guessing. We use 14-point data
                  comparison to ensure accuracy.
                </p>
              </div>
            </div>
          </div>
          {/* Stats Ticker (Horizontal Scroll) */}
          <div className="w-full overflow-x-auto no-scrollbar pb-2 px-4">
            <div className="flex gap-3 min-w-max">
              <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 min-w-[140px]">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Match Rate
                </p>
                <p className="text-primary dark:text-primary font-bold text-2xl tracking-tight">
                  99.9%
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 min-w-[140px]">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Latency
                </p>
                <p className="text-slate-900 dark:text-slate-100 font-bold text-2xl tracking-tight">
                  &lt; 2s
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 min-w-[140px]">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Safety Score
                </p>
                <p className="text-slate-900 dark:text-slate-100 font-bold text-2xl tracking-tight">
                  100%
                </p>
              </div>
            </div>
          </div>
          {/* Process Flow Stepper */}
          <div className="px-4 pt-8 pb-4">
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight mb-6">
              The Settlement Process
            </h2>
            <div className="grid grid-cols-[32px_1fr] gap-x-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="w-[2px] bg-slate-200 dark:bg-slate-700 h-full min-h-[60px]"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                    Auto-Match Engine
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Our engine ingests transaction data and applies rigorous 14-point comparison
                    rules.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 p-2 rounded-lg border border-primary/10 w-fit">
                    <Zap className="h-4 w-4" />
                    <span>100% Confidence Matching</span>
                  </div>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center size-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="w-[2px] bg-slate-200 dark:bg-slate-700 h-full min-h-[60px]"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                    Human-in-the-Loop Review
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    When logic finds an anomaly, it's flagged for expert review. No guessing
                    allowed.
                  </p>
                  {/* Mini UI Card Simulation */}
                  <div className="mt-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                        Exception
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: #8821X</span>
                    </div>
                    <div className="flex gap-2 items-center mb-3">
                      <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-orange-400"></div>
                      </div>
                      <span className="text-[10px] text-slate-500">75% Match</span>
                    </div>
                    <button className="w-full py-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm">
                      Start Manual Review
                    </button>
                  </div>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Lock className="h-5 w-5" />
                </div>
              </div>
              <div className="pb-4 pt-1">
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">
                    Final Settlement
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Once verified, data is written to an immutable ledger. Safe, secure, and
                    permanent.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Guardrails Grid */}
          <div className="p-4 pt-2 pb-24">
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight mb-4">
              Safety Guardrails
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 w-fit shadow-sm text-primary">
                  <ScrollText className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                  Audit Trails
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every action is logged and searchable.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 w-fit shadow-sm text-primary">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                  RBAC
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strict role-based access control.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 w-fit shadow-sm text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                  Encryption
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AES-256 encryption at rest.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 w-fit shadow-sm text-primary">
                  <Eye className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                  Read-Only
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Restricted views for external auditors.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Sticky Bottom Action */}
        <div className="absolute bottom-0 w-full p-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800">
          <button className="w-full flex cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold shadow-lg shadow-primary/20">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDashboard;
