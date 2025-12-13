/**
 * Comparison Table Component
 * 
 * Shows Settler vs competitors or manual processes.
 * Highlights competitive advantages.
 */

'use client';

import { CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ComparisonFeature {
  feature: string;
  settler: boolean | string;
  competitor: boolean | string;
  highlight?: boolean;
}

const features: ComparisonFeature[] = [
  {
    feature: 'API-First Architecture',
    settler: true,
    competitor: 'Limited',
    highlight: true,
  },
  {
    feature: 'Deterministic Matching',
    settler: true,
    competitor: false,
    highlight: true,
  },
  {
    feature: 'Real-Time Webhooks',
    settler: true,
    competitor: 'Batch Only',
    highlight: true,
  },
  {
    feature: 'Multi-Currency Support',
    settler: true,
    competitor: true,
  },
  {
    feature: 'Receipt OCR',
    settler: true,
    competitor: false,
    highlight: true,
  },
  {
    feature: 'Feature Flags API',
    settler: true,
    competitor: false,
    highlight: true,
  },
  {
    feature: 'SOC 2 Ready',
    settler: true,
    competitor: 'Planned',
  },
  {
    feature: 'Self-Hosted Option',
    settler: true,
    competitor: false,
  },
  {
    feature: 'Developer-First SDKs',
    settler: '4 Languages',
    competitor: '1-2 Languages',
    highlight: true,
  },
  {
    feature: 'Pricing Transparency',
    settler: 'Public Pricing',
    competitor: 'Contact Sales',
    highlight: true,
  },
];

export function ComparisonTable() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900"
      role="region"
      aria-labelledby="comparison-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="comparison-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
          >
            Settler vs. The Competition
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            See why developers and finance teams choose Settler
          </p>
        </div>

        <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Feature comparison">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left p-4 font-semibold text-slate-900 dark:text-white">
                      Feature
                    </th>
                    <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center justify-center gap-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                          Settler
                        </Badge>
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400">
                      Competitors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className={cn(
                        'border-b border-slate-100 dark:border-slate-800',
                        feature.highlight && 'bg-blue-50/50 dark:bg-blue-900/10',
                        'hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                      )}
                    >
                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                        {feature.feature}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.settler === 'boolean' ? (
                          feature.settler ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {feature.settler}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">
                        {typeof feature.competitor === 'boolean' ? (
                          feature.competitor ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-6 h-6 text-slate-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.competitor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            * Comparison based on publicly available information as of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}
