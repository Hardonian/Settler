import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Integrations - Docs',
  description: 'Browse available integrations and adapters',
};

export default function IntegrationsPage() {
  const integrations = [
    { name: 'Stripe', href: '/docs/integrations/stripe', category: 'Payment' },
    { name: 'Shopify', href: '/docs/integrations/shopify', category: 'E-commerce' },
    { name: 'QuickBooks', href: '/docs/integrations/quickbooks', category: 'Accounting' },
    { name: 'PayPal', href: '/docs/integrations/paypal', category: 'Payment' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-6">Integrations</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Connect Settler with your favorite platforms using pre-built adapters.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <Link
            key={integration.name}
            href={integration.href}
            className="block p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">{integration.name}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{integration.category}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View integration guide →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
