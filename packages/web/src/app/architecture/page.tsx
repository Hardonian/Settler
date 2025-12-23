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
        src="/assets/marketing/hero-image-3.png"
        alt="Settler Architecture Diagram"
        width={1258}
        height={618}
        className="w-full h-auto object-contain md:object-cover"
        priority
        sizes="100vw"
        style={{ maxWidth: '100%', height: 'auto' }}
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

        {/* Data Flow Diagram */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              Data Flow Architecture
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              See how data moves through Settler's reconciliation pipeline
            </p>
          </div>
          <figure className="w-full overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8">
            <div className="relative w-full">
              <Image
                src="/assets/marketing/hero-image-1.png"
                alt="Settler data flow diagram showing how data moves from source platforms through adapters to reconciliation engine and target platforms"
                width={1258}
                height={618}
                className="w-full h-auto object-contain md:object-cover"
                sizes="100vw"
                style={{ maxWidth: '100%', height: 'auto' }}
                priority={false}
              />
            </div>
            <figcaption className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center px-4">
              Data flows from source platforms through adapters, processed by the reconciliation engine, and synchronized to target platforms with full audit trails.
            </figcaption>
          </figure>
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
              to re-calculate balances or audit changes with high fidelity.
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
