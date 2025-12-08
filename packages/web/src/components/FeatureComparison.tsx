import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Feature {
  name: string;
  free: boolean | string;
  commercial: boolean | string;
  enterprise: boolean | string;
}

const features: Feature[] = [
  { name: 'Monthly Reconciliations', free: '1,000', commercial: '100,000', enterprise: 'Unlimited' },
  { name: 'Platform Adapters', free: '2', commercial: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Log Retention', free: '7 days', commercial: '30 days', enterprise: 'Unlimited' },
  { name: 'Real-time Webhooks', free: false, commercial: true, enterprise: true },
  { name: 'API Access', free: true, commercial: true, enterprise: true },
  { name: 'Community Support', free: true, commercial: false, enterprise: false },
  { name: 'Email Support', free: false, commercial: true, enterprise: false },
  { name: 'Priority Support', free: false, commercial: false, enterprise: true },
  { name: 'SSO / SAML', free: false, commercial: false, enterprise: true },
  { name: 'RBAC', free: false, commercial: false, enterprise: true },
  { name: 'White-label', free: false, commercial: false, enterprise: true },
  { name: 'On-premise Deployment', free: false, commercial: false, enterprise: true },
];

export function FeatureComparison() {
  const renderValue = (value: boolean | string) => {
    if (value === true) return <span className="text-green-600 dark:text-green-400">✓</span>;
    if (value === false) return <span className="text-slate-400">—</span>;
    return <span className="text-slate-700 dark:text-slate-300">{value}</span>;
  };

  return (
    <div className="py-16 bg-white/50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Compare Plans
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Choose the plan that fits your needs
          </p>
        </div>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-x-auto">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-4 font-semibold text-slate-900 dark:text-white">Feature</th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                    <div>Free</div>
                    <Badge className="mt-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">OSS</Badge>
                  </th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                    <div>Commercial</div>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">$99/mo</Badge>
                  </th>
                  <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                    <div>Enterprise</div>
                    <Badge className="mt-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Custom</Badge>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{feature.name}</td>
                    <td className="p-4 text-center">{renderValue(feature.free)}</td>
                    <td className="p-4 text-center">{renderValue(feature.commercial)}</td>
                    <td className="p-4 text-center">{renderValue(feature.enterprise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
