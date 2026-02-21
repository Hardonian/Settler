
import ResultsTable from '@/components/stitch-import/ResultsTable';
import EvidenceViewer from '@/components/stitch-import/EvidenceViewer';

export default function ResultsPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white overflow-hidden">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 pt-11 pb-2 px-4 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-tight">Reconciliation Results</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[24px]">ios_share</span>
            </button>
            <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-[24px]">download</span>
            </button>
          </div>
        </div>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input className="w-full bg-slate-100 dark:bg-surface-dark border-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow" placeholder="Search by Trace ID..." type="text" />
        </div>
      </header>
      <ResultsTable />
      <EvidenceViewer />
    </div>
  );
}
