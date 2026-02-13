import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold text-foreground">Contact Settler</h1>
        <p className="mt-4 text-muted-foreground">
          Talk to our team about deterministic reconciliation APIs, tenant-safe architecture, and implementation planning.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="mt-1 text-lg font-medium text-foreground">support@settler.dev</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
