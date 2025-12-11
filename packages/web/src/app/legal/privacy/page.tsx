import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Settler Privacy Policy - Learn how we collect, use, and protect your personal data.',
  robots: {
    index: true,
    follow: true,
  },
};

// Revalidate every hour for legal pages (they change infrequently)
export const revalidate = 3600;

export default function PrivacyPage() {
  return (
    <AnimatedPageWrapper aria-label="Privacy Policy page">
      <Navigation />
      
      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Privacy Policy' }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Privacy Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <p>
            At Settler ("we", "us", "our"), we respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our 
            website and use our API services.
          </p>

          <h3>1. Information We Collect</h3>
          <p>We collect information that you provide directly to us:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, company name, and password when you register.</li>
            <li><strong>Billing Information:</strong> Payment method details (processed securely by our payment providers) and billing address.</li>
            <li><strong>Usage Data:</strong> API logs, request metadata, and interaction with our console.</li>
          </ul>

          <h3>2. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send related information, including confirmations and invoices.</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
          </ul>

          <h3>3. Data Retention</h3>
          <p>
            We store the information we collect for as long as it is necessary for the purpose(s) for which we originally collected it. 
            We may retain certain information for legitimate business purposes or as required by law.
          </p>

          <h3>4. Data Security</h3>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, 
            disclosure, alteration and destruction. This includes encryption of data in transit and at rest.
          </p>

          <h3>5. Sharing of Information</h3>
          <p>
            We do not share your personal information with third parties except as described in this policy:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., payment processing, hosting).</li>
            <li><strong>Legal Compliance:</strong> We may disclose information if we believe disclosure is in accordance with, or required by, any applicable law or legal process.</li>
          </ul>

          <h3>6. Your Rights</h3>
          <p>
            Depending on your location, you may have rights regarding your personal data, including the right to access, 
            correct, delete, or restrict use of your personal data. To exercise these rights, please contact us.
          </p>

          <h3>7. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@settler.dev">privacy@settler.dev</a>.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
