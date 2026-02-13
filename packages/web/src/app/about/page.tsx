import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-semibold text-foreground">About Settler</h1>
        <p className="mt-4 text-muted-foreground">
          Settler builds reconciliation infrastructure for modern finance teams. The platform is API-first,
          deterministic at its core, and supports AI-assisted discrepancy review with audit-safe evidence trails.
        </p>
      </main>
      <Footer />
    </div>
  );
}
