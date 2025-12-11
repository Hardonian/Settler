import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Settler Terms of Service - Read our terms and conditions for using our reconciliation API service.',
  robots: {
    index: true,
    follow: true,
  },
};

// Revalidate every hour for legal pages (they change infrequently)
export const revalidate = 3600;

export default function TermsPage() {
  return (
    <AnimatedPageWrapper aria-label="Terms of Service page">
      <Navigation />
      
      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Terms of Service' }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Terms of Service</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using the Settler.dev platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you disagree with any part of the terms, you may not access the Service.
          </p>

          <h3>2. Description of Service</h3>
          <p>
            Settler provides API infrastructure for financial reconciliation, receipt parsing, and feature flagging. 
            We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice.
          </p>

          <h3>3. Accounts and Security</h3>
          <p>
            You are responsible for maintaining the security of your account and API keys. You are fully responsible for all activities 
            that occur under the account and any other actions taken in connection with it. You must immediately notify Settler of any 
            unauthorized uses of your account or any other breaches of security.
          </p>

          <h3>4. API Usage and Limits</h3>
          <p>
            You agree not to abuse the API. Abuse includes but is not limited to:
          </p>
          <ul>
            <li>Exceeding rate limits repeatedly</li>
            <li>Attempting to bypass security measures</li>
            <li>Using the API for illegal purposes</li>
            <li>Reverse engineering the platform</li>
          </ul>
          <p>
            We reserve the right to suspend access to the API if we detect abusive behavior.
          </p>

          <h3>5. Intellectual Property</h3>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Settler 
            and its licensors. The Service is protected by copyright, trademark, and other laws.
          </p>

          <h3>6. Termination</h3>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
          </p>

          <h3>7. Limitation of Liability</h3>
          <p>
            In no event shall Settler, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any 
            indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, 
            use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h3>8. Governing Law</h3>
          <p>
            These Terms shall be governed and construed in accordance with the laws of Delaware, United States, without regard to its 
            conflict of law provisions.
          </p>

          <h3>9. Changes</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material 
            we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h3>10. Contact Us</h3>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@settler.dev">legal@settler.dev</a>.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
