import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Settler Blog</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Product updates, integration deep dives, and reconciliation best practices.
        </p>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            We are preparing long-form articles for engineering and finance operations teams.
          </p>
          <Link href="/docs" className="text-blue-600 hover:underline">
            Explore docs while we publish our first posts →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
