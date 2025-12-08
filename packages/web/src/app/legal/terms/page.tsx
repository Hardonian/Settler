import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';

export default function TermsPage() {
  return (
    <AnimatedPageWrapper aria-label="Terms of Service page">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            <strong>Last Updated:</strong> January 1, 2024
          </p>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Please read these Terms of Service carefully before using Settler. By accessing or using our service, 
            you agree to be bound by these terms.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            For the complete Terms of Service, please contact us at legal@settler.dev or visit our 
            <a href="https://github.com/shardie-github/Settler-API" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              GitHub repository
            </a>.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
