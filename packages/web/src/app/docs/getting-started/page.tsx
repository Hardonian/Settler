import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Getting Started - Docs',
  description: 'Get started with Settler in minutes',
};

export default function GettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-6">Getting Started</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-8">
          Welcome to Settler! This guide will help you get up and running in minutes.
        </p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Create an account
                </Link> or sign in to your existing account
              </li>
              <li>
                <Link href="/console/playground" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Try the Playground
                </Link> to test the API without setup
              </li>
              <li>
                <Link href="/docs/quickstart" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Follow the Quickstart guide
                </Link> to create your first reconciliation
              </li>
              <li>
                <Link href="/console/api-keys" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Generate an API key
                </Link> to start integrating
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><Link href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">Explore the API Reference</Link></li>
              <li><Link href="/docs/integrations" className="text-blue-600 dark:text-blue-400 hover:underline">Browse Integrations</Link></li>
              <li><Link href="/docs/sdk" className="text-blue-600 dark:text-blue-400 hover:underline">Install an SDK</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
