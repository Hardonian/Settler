import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Check, X } from 'lucide-react';

export default function WhySettlerPage() {
  return (
    <AnimatedPageWrapper aria-label="Why Settler page">
      <Navigation />
      
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 text-slate-900 dark:text-white">
            Stop building financial infrastructure from scratch
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Settler provides the primitives you need to build reliable financial products, 
            so you can focus on your core business logic.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* The Old Way */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-red-200 dark:border-red-900/30">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-500">The Old Way</h3>
                <X className="w-8 h-8 text-red-500" />
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Manual CSV exports and VLOOKUPs</span>
                </li>
                <li className="flex gap-3">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Fragile cron jobs that break silently</span>
                </li>
                <li className="flex gap-3">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Untyped floating point math errors</span>
                </li>
                <li className="flex gap-3">
                  <X className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Building custom internal admin tools</span>
                </li>
              </ul>
            </div>

            {/* The Settler Way */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-green-200 dark:border-green-900/30 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">The Settler Way</h3>
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-medium">Webhook-based reconciliation with near-real-time results</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-medium">Typed SDKs and structured errors</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-medium">Deterministic financial math</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-medium">Production-ready Developer Console</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
