import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const capabilities = [
  'Reconciliation API with deterministic execution',
  'AI-assisted discrepancy review layered after deterministic matching',
  'Feature flags for finance workflows and phased rollouts',
  'Audit logging with immutable evidence trails',
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-semibold text-foreground">
          Deterministic Reconciliation. AI-Assisted Review.
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Settler is API-first infrastructure for finance teams: deterministic reconciliation core,
          AI review assist, tenant-safe isolation, and audit-grade traceability.
        </p>

        <div className="mt-10 rounded-xl border border-border p-6">
          <Image
            src="/assets/diagrams/data-flow.svg"
            alt="Data In to deterministic engine to AI review to audit trail"
            width={960}
            height={360}
            className="h-auto w-full"
            priority
          />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground">Platform capabilities</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {capabilities.map((capability) => (
              <li key={capability} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                {capability}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
