import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Scale, Shield, FileText, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Center',
  description: 'Settler Legal Center - Terms, Privacy, DPA, and Compliance information.',
};

export default function LegalIndexPage() {
  const legalDocs = [
    {
      title: 'Terms of Service',
      description: 'The agreement between you and Settler regarding your use of our services.',
      href: '/legal/terms',
      icon: Scale,
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal data.',
      href: '/legal/privacy',
      icon: Lock,
    },
    {
      title: 'Data Processing Agreement',
      description: 'Terms for processing personal data, including GDPR compliance.',
      href: '/legal/dpa',
      icon: FileText,
    },
    {
      title: 'Subprocessors',
      description: 'List of third-party service providers who process data on our behalf.',
      href: '/legal/subprocessors',
      icon: Globe,
    },
    {
      title: 'Open Source License',
      description: 'MIT License details for our open-source core components.',
      href: '/legal/license',
      icon: Shield,
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Legal Center">
      <Navigation />
      
      <section className="px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Legal Center
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Transparency is core to our infrastructure. Here you'll find all our legal documents and compliance information.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2">
            {legalDocs.map((doc) => {
              const Icon = doc.icon;
              return (
                <Link key={doc.href} href={doc.href} className="block group">
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-400/50">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {doc.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Have security or compliance questions?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              Our security team is available to answer questions about our compliance posture, SOC 2 reports, and security practices.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/security"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                View Security Center
              </Link>
              <a 
                href="mailto:security@settler.dev"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Security
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
