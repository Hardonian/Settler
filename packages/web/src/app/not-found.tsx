import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navigation />
      
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-9xl font-bold text-slate-200 dark:text-slate-800 mb-4">404</h1>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Page Not Found</h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in this timeline.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">View Documentation</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/status">Check System Status</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
