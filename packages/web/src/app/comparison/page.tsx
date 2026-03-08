/**
 * Comparison Page
 *
 * How Settler compares to common reconciliation alternatives.
 */

import { Metadata } from "next";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "How Settler Compares - Settler",
  description:
    "Settler vs custom scripts and generic ETL tools: deterministic output, hash chain evidence, run replay, tenant isolation, and open source core.",
};

export const dynamic = "force-dynamic";

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
              Purpose-built reconciliation infrastructure vs. custom scripts and generic ETL tools.
              See what you get with Settler that the alternatives cannot provide.
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
