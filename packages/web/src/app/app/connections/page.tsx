
import ConnectionsTable from '@/components/stitch-import/ConnectionsTable';
import ConnectionDrawer from '@/components/stitch-import/ConnectionDrawer';

export default function ConnectionsPage() {
  return (
    <div className="bg-background-light font-display antialiased text-slate-900 overflow-hidden h-screen flex flex-col">
      <header className="flex-none pt-12 pb-4 px-4 bg-background-light border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connections</h1>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <div className="flex gap-3 mt-6 overflow-x-auto hide-scrollbar pb-1">
          <div className="flex-1 min-w-[100px] bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-xl font-bold text-slate-900">12</span>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-xl p-3 border-l-4 border-l-emerald-500 border-y border-r border-slate-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              Healthy
            </span>
            <span className="text-xl font-bold text-slate-900">9</span>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-xl p-3 border-l-4 border-l-red-500 border-y border-r border-slate-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
              Failing
            </span>
            <span className="text-xl font-bold text-slate-900">3</span>
          </div>
        </div>
      </header>
      <ConnectionsTable />
      <ConnectionDrawer />
    </div>
  );
}
