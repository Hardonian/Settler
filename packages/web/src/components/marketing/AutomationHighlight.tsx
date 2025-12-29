/**
 * Automation Highlight Component
 * 
 * Attractive marketing component highlighting the automated reconciliation review system
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Shield, TrendingUp } from 'lucide-react';

export function AutomationHighlight() {
  const features = [
    {
      icon: Zap,
      title: '95%+ Instant Resolution',
      description: 'Confidence-based auto-resolution processes matches instantly',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: Shield,
      title: 'Industry-Standard Compliance',
      description: 'SOC 2, PCI-DSS, GAAP/IFRS compliant automated review',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: TrendingUp,
      title: 'Zero Manual Intervention',
      description: 'Complete automation with rule-based exception handling',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: CheckCircle2,
      title: 'Complete Audit Trail',
      description: 'Every decision logged automatically for compliance',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            Fully Automated
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Reconciliation Without the Manual Work
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Our industry-standard automated review system processes 95%+ of matches instantly. 
            No spreadsheets. No manual matching. Just automated, compliant reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className={`${feature.bgColor} border-2 border-transparent hover:border-current transition-all duration-200`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${feature.color}`}>
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              How Automated Review Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">≥95%</div>
                <div className="text-sm opacity-90">Auto-Approved Instantly</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">80-95%</div>
                <div className="text-sm opacity-90">Rule-Based Resolution</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">60-80%</div>
                <div className="text-sm opacity-90">Exception Handling</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">&lt;1%</div>
                <div className="text-sm opacity-90">System Review</div>
              </div>
            </div>
            <p className="mt-8 text-lg opacity-90">
              Every decision is logged automatically with complete audit trails. 
              SOC 2, PCI-DSS, GAAP, and IFRS compliant—zero manual intervention required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
