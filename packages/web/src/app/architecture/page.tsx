import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const InfographicSection = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.InfographicSection })), { 
  ssr: true,
  loading: () => <div className="py-20" />
});

function ArchitectureDiagram() {
  return (
    <figure className="w-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
      <Image
        src="/assets/diagrams/system-architecture.svg"
        alt="Settler Architecture Diagram"
        width={800}
        height={400}
        className="w-full h-auto"
        priority
      />
      <figcaption id="architecture-diagram-caption" className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center">
        Settler architecture: API Gateway routes requests to core services (Reconciliation, Receipts, Feature Flags), all backed by a distributed event-sourced data store.
      </figcaption>
    </figure>
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

        {/* Reconciliation Workflow Diagram */}
        <div className="max-w-7xl mx-auto mb-20">
          <InfographicSection />
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
