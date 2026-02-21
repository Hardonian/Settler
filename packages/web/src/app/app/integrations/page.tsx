
import IntegrationList from '@/components/stitch-import/IntegrationList';

export default function IntegrationsPage() {
  return (
    <div className="bg-background-light text-text-main min-h-screen flex flex-col font-display selection:bg-primary/20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="px-5 pt-12 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrations</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your active connectors</p>
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>
      <IntegrationList />
    </div>
  );
}
