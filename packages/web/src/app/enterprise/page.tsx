import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-semibold text-foreground">Enterprise</h1>
        <p className="mt-4 text-muted-foreground">
          Deploy Settler with tenant isolation, policy controls, and deterministic reconciliation APIs for production finance operations.
        </p>
      </main>
      <Footer />
    </div>
  );
}
