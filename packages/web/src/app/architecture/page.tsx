import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';

function ArchitectureDiagram() {
  return (
    <div className="w-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
      <svg viewBox="0 0 800 400" className="w-full h-auto" style={{ maxHeight: '500px' }}>
        <defs>
          <marker id="head" orient="auto" markerWidth="6" markerHeight="6" refX="6" refY="3">
            <path d="M0,0 L6,3 L0,6" fill="currentColor" className="text-slate-400" />
          </marker>
        </defs>
        
        {/* API Gateway */}
        <g transform="translate(300, 50)">
          <rect width="200" height="60" rx="8" className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-500 stroke-2" />
          <text x="100" y="35" textAnchor="middle" className="fill-slate-900 dark:fill-white font-bold text-sm">API Gateway (Edge)</text>
        </g>

        {/* Services Layer */}
        <g transform="translate(100, 200)">
          <rect width="140" height="80" rx="8" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 stroke-2" />
          <text x="70" y="35" textAnchor="middle" className="fill-slate-900 dark:fill-white font-semibold text-sm">Reconciliation</text>
          <text x="70" y="55" textAnchor="middle" className="fill-slate-500 text-xs">Matching Engine</text>
        </g>

        <g transform="translate(330, 200)">
          <rect width="140" height="80" rx="8" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 stroke-2" />
          <text x="70" y="35" textAnchor="middle" className="fill-slate-900 dark:fill-white font-semibold text-sm">Receipts</text>
          <text x="70" y="55" textAnchor="middle" className="fill-slate-500 text-xs">OCR & Parsing</text>
        </g>

        <g transform="translate(560, 200)">
          <rect width="140" height="80" rx="8" className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 stroke-2" />
          <text x="70" y="35" textAnchor="middle" className="fill-slate-900 dark:fill-white font-semibold text-sm">Feature Flags</text>
          <text x="70" y="55" textAnchor="middle" className="fill-slate-500 text-xs">Edge Evaluation</text>
        </g>

        {/* Data Layer */}
        <g transform="translate(200, 350)">
          <rect width="400" height="40" rx="8" className="fill-indigo-50 dark:fill-indigo-900/20 stroke-indigo-400 stroke-2" />
          <text x="200" y="25" textAnchor="middle" className="fill-slate-900 dark:fill-white font-bold text-sm">Distributed Data Store & Event Log</text>
        </g>

        {/* Connections */}
        <path d="M400,110 L400,180" className="stroke-slate-400 stroke-2" markerEnd="url(#head)" />
        <path d="M400,180 L170,180 L170,200" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />
        <path d="M400,180 L400,200" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />
        <path d="M400,180 L630,180 L630,200" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />

        <path d="M170,280 L170,330 L300,330 L300,350" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />
        <path d="M400,280 L400,350" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />
        <path d="M630,280 L630,330 L500,330 L500,350" className="stroke-slate-400 stroke-2 fill-none" markerEnd="url(#head)" />
      </svg>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <AnimatedPageWrapper aria-label="Architecture page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Architecture' }]} />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Built for Financial Correctness
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Settler uses a double-entry ledger core, event-sourced reconciliation engine, 
            and edge-optimized API gateway to ensure performance and accuracy.
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <ArchitectureDiagram />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">Event Sourcing</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Every action is recorded as an immutable event. We can replay history 
              to re-calculate balances or audit changes with 100% fidelity.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Idempotency Keys</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Network failures shouldn't cause double charges. Our API enforces 
              strict idempotency across all state-changing operations.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Edge Execution</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Feature flags and read-heavy operations run on the edge, closest 
              to your users, ensuring minimal latency overhead.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
