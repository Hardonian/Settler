import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License',
  description: 'Settler License - MIT License information for the Settler reconciliation API.',
  robots: {
    index: true,
    follow: true,
  },
};

// Revalidate every hour for legal pages (they change infrequently)
export const revalidate = 3600;

export default function LicensePage() {
  return (
    <AnimatedPageWrapper aria-label="License page">
      <Navigation />
      
      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'License' }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Licenses</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="mb-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">Dual Licensing Model</h3>
            <p className="text-blue-800 dark:text-blue-200">
              Settler operates under a dual-licensing model. Our core SDKs and protocol definitions are open source (MIT), 
              while our managed platform and advanced features are covered by our Commercial Terms.
            </p>
          </div>

          <h2 className="text-2xl font-bold mb-4">Open Source License (SDKs & Protocol)</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The Settler SDKs, CLI, and Protocol definitions are licensed under the <strong>MIT License</strong>.
          </p>
          <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm mb-12 overflow-x-auto">
            <p className="mb-4">Copyright (c) 2025 Settler Inc.</p>
            <p className="mb-4">
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the "Software"), to deal
              in the Software without restriction...
            </p>
            <p className="text-slate-500 italic">
              (See full text on GitHub)
            </p>
          </div>

          <h2 className="text-2xl font-bold mb-4">Commercial License (Managed Platform)</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
             Usage of the Settler Hosted Platform, API endpoints (api.settler.dev), and advanced features 
             (e.g. historical replay, long-term retention, enterprise SSO) is governed by our 
             <a href="/legal/terms" className="text-blue-600 hover:underline mx-1">Terms of Service</a> 
             and specific Master Services Agreements (MSA) for enterprise customers.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
