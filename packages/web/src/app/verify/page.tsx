import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import VerifyClient from './verify-client';

export const metadata = {
  title: 'Verify Evidence Bundle',
  description: 'Verify Settler evidence bundles locally in your browser.',
};

export default function VerifyPage() {
  return (
    <AnimatedPageWrapper aria-label="Verify evidence bundle">
      <Navigation />
      <main className="px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Verify Evidence Bundle
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Run client-side verification to surface discrepancies between the
            manifest and bundle files. Verification is optional; if the wasm
            verifier is unavailable, use the CLI verifier.
          </p>
          <VerifyClient />
        </div>
      </main>
      <Footer />
    </AnimatedPageWrapper>
  );
}
