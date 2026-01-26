import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" id="main-content">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">{description}</p>
            ) : null}
          </header>
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
