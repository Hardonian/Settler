/**
 * Comparison Page
 * 
 * Detailed comparison with competitors.
 */

import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function ComparisonPage() {
  return (
    <>
      <Navigation />
      <main>
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              How Settler Compares
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See why Settler's judgment layer and meaningful insights set us apart from the competition.
            </p>
          </div>
        </div>
        <ComparisonTable />
        <FeatureShowcase />
      </main>
      <Footer />
    </>
  );
}
