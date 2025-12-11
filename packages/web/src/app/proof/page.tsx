import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function ProofPage() {
  const cases = [
    {
      company: "Acme Fintech",
      title: "Automating 50k transactions/day",
      result: "Reduced manual recon team from 5 to 1, saving $300k/yr",
      quote: "Settler turned our month-end close from a nightmare into a non-event."
    },
    {
      company: "GlobalSaaS",
      title: "Multi-currency made easy",
      result: "Launched in 12 new countries in 2 weeks",
      quote: "The conversion API handled FX complexity we didn't even know existed."
    },
    {
      company: "ReceiptRocket",
      title: "99.9% Extraction Accuracy",
      result: "Replaced human data entry for expense reports",
      quote: "We tried 3 other OCR providers. Settler was the only one that handled our edge cases."
    }
  ];

  return (
    <AnimatedPageWrapper aria-label="Proof page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Proof' }]} />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Trusted by Engineering Teams
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            See how companies are using Settler to solve complex financial infrastructure problems.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((study) => (
            <div key={study.company} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
              <div className="mb-6">
                <div className="font-bold text-slate-400 uppercase tracking-wide text-sm mb-2">{study.company}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{study.title}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium">{study.result}</p>
              </div>
              <blockquote className="mt-auto border-l-4 border-slate-200 dark:border-slate-700 pl-4 italic text-slate-600 dark:text-slate-400">
                "{study.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
