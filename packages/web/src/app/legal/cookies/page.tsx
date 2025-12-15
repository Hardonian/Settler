import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Settler Cookie Policy - Learn how we use cookies and manage your preferences.',
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 3600;

export default function CookiePolicyPage() {
  return (
    <AnimatedPageWrapper aria-label="Cookie Policy page">
      <Navigation />
      
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Cookie Policy' }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Cookie Policy</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <h3>1. What Are Cookies?</h3>
          <p>
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences and 
            understanding how you use our site.
          </p>

          <h3>2. Types of Cookies We Use</h3>
          
          <h4>2.1 Necessary Cookies</h4>
          <p>
            These cookies are essential for the website to function properly. They enable core 
            functionality such as security, network management, and accessibility. You cannot opt-out 
            of these cookies as they are required for the site to work.
          </p>
          <ul>
            <li>Authentication and session management</li>
            <li>Security and fraud prevention</li>
            <li>Load balancing and performance</li>
          </ul>

          <h4>2.2 Analytics Cookies</h4>
          <p>
            These cookies help us understand how visitors interact with our website by collecting 
            and reporting information anonymously. This helps us improve our services.
          </p>
          <ul>
            <li>Page views and navigation patterns</li>
            <li>Performance metrics</li>
            <li>Error tracking</li>
          </ul>

          <h4>2.3 Marketing Cookies</h4>
          <p>
            These cookies are used to deliver personalized advertisements and track campaign 
            performance. They may be set by us or by third-party advertising partners.
          </p>
          <ul>
            <li>Ad targeting and personalization</li>
            <li>Campaign effectiveness measurement</li>
            <li>Cross-site tracking (with your consent)</li>
          </ul>

          <h3>3. Managing Your Cookie Preferences</h3>
          <p>
            You can manage your cookie preferences at any time by clicking the cookie settings icon 
            in the footer or by visiting this page. You can choose to accept all cookies, reject 
            non-essential cookies, or customize your preferences by category.
          </p>

          <h3>4. Third-Party Cookies</h3>
          <p>
            Some cookies are placed by third-party services that appear on our pages. We do not 
            control these cookies. Please refer to the third party's privacy policy for more 
            information.
          </p>

          <h3>5. Do Not Track</h3>
          <p>
            We respect your browser's "Do Not Track" (DNT) setting and Global Privacy Control (GPC) 
            signals. When DNT or GPC is enabled, we will only use necessary cookies and will not 
            enable analytics or marketing cookies.
          </p>

          <h3>6. Cookie Retention</h3>
          <p>
            Cookies are stored on your device for varying periods:
          </p>
          <ul>
            <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent cookies:</strong> Remain until they expire or you delete them</li>
            <li><strong>Consent preferences:</strong> Stored for up to 365 days</li>
          </ul>

          <h3>7. Your Rights</h3>
          <p>
            Depending on your location, you may have certain rights regarding cookies:
          </p>
          <ul>
            <li>Right to be informed about cookie usage</li>
            <li>Right to consent or opt-out</li>
            <li>Right to withdraw consent at any time</li>
            <li>Right to access information about cookies used</li>
          </ul>

          <h3>8. Changes to This Policy</h3>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the "Last Updated" date.
          </p>

          <h3>9. Contact Us</h3>
          <p>
            If you have questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@settler.dev">privacy@settler.dev</a>.
          </p>

          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>Note:</strong> This policy is provided for informational purposes only and does 
              not constitute legal advice. Please consult with a legal professional for advice specific 
              to your situation.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
