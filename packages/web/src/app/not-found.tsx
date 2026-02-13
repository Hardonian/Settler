import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          The route does not exist. Use the platform navigation to continue.
        </p>
        <Link href="/" className="mt-8 inline-block text-primary hover:underline">
          Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
