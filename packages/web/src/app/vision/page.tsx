import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Vision - Settler",
  description:
    "Settler's long-term vision: financial infrastructure where every reconciliation is deterministic, every decision is auditable, and trust is verifiable by any party.",
};

export default function VisionPage() {
  return (
    <AnimatedPageWrapper aria-label="Vision page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Vision' }]} />
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
            Why We Are Building Settler
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 font-serif italic leading-relaxed">
            "Financial correctness shouldn't require a department. It should be an import."
          </p>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
          <p>
            Three years ago, I was working at a fast-growing fintech. We had a problem: our internal database said we had $10M in processed transactions, but Stripe said we had $9.8M. 
          </p>
          <p>
            Where was the missing $200k?
          </p>
          <p>
            It took three engineers two weeks to find out. We had to parse thousands of CSVs, debug timezone mismatches between Postgres and the banking system, and trace floating-point rounding errors in our Node.js backend.
          </p>
          <p>
            We weren't alone. Every company that touches money eventually builds a "Reconciliation Team." Usually, it's a mix of frustrated engineers writing fragile cron jobs and operations folks drowning in spreadsheets.
          </p>

          <h3>The "Truth Layer" of the Internet</h3>
          <p>
            We believe that financial evidence—proof that a transaction happened, that a receipt matches a charge, that a conversion was calculated correctly—is too important to be hacked together.
          </p>
          <p>
            Settler is our attempt to solve this permanently. We aren't just building an API; we are building the <strong>Truth Layer</strong> for the internet economy.
          </p>

          <h3>Our Principles</h3>
          <ul>
            <li><strong>Correctness &gt; Convenience.</strong> We will break your build if you try to use unsafe types for money. We will refuse to guess at a currency conversion.</li>
            <li><strong>Code is Law.</strong> Financial logic should be version-controlled, testable code, not hidden in PDF contracts or Excel formulas.</li>
            <li><strong>Developer Obsession.</strong> Integrating a ledger should feel as good as using Stripe or Vercel. Typed SDKs, great docs, and instant feedback loops.</li>
          </ul>

          <h3>The Road Ahead</h3>
          <p>
            We are starting with Reconciliation, Receipts, and Flags. But our vision is broader. We want to be the standard library for value transfer. 
          </p>
          <p>
            If you believe that software should be robust, correct, and beautiful, join us.
          </p>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {/* Placeholder for founder avatar */}
                <div className="w-full h-full flex items-center justify-center text-slate-500">S</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">The Settler Team</div>
                <div className="text-sm text-slate-500">San Francisco, CA</div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </AnimatedPageWrapper>
  );
}
