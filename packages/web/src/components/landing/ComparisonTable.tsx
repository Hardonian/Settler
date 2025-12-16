/**
 * Comparison Table Component
 * 
 * Compare Settler with competitors, highlighting unique features.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Competitor {
  name: string;
  logo?: string;
  features: Record<string, boolean | string>;
}

const competitors: Competitor[] = [
  {
    name: 'Settler',
    features: {
      'Meaningful Changes': true,
      'Impact Ranking': true,
      'Hash Chain Receipts': true,
      'AI Analysis': 'Pro+',
      'Judgment Layer': true,
      'Feature Flags as Policy': true,
      'Tamper-Evident Audit Trail': true,
      'Explanations & Why It Matters': true,
    },
  },
  {
    name: 'Competitor A',
    features: {
      'Meaningful Changes': false,
      'Impact Ranking': false,
      'Hash Chain Receipts': false,
      'AI Analysis': false,
      'Judgment Layer': false,
      'Feature Flags as Policy': false,
      'Tamper-Evident Audit Trail': false,
      'Explanations & Why It Matters': false,
    },
  },
  {
    name: 'Competitor B',
    features: {
      'Meaningful Changes': 'Basic',
      'Impact Ranking': false,
      'Hash Chain Receipts': false,
      'AI Analysis': 'Enterprise Only',
      'Judgment Layer': false,
      'Feature Flags as Policy': false,
      'Tamper-Evident Audit Trail': false,
      'Explanations & Why It Matters': 'Limited',
    },
  },
];

const features = Object.keys(competitors[0]?.features || {});

export function ComparisonTable() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
            Comparison
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How Settler Compares
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            See why Settler's judgment layer and meaningful insights set us apart.
          </p>
        </motion.div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-800">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    {competitors.map((competitor) => (
                      <th
                        key={competitor.name}
                        className={`text-center p-4 font-semibold ${
                          competitor.name === 'Settler'
                            ? 'bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                            : ''
                        }`}
                      >
                        {competitor.name === 'Settler' && (
                          <Badge className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Best
                          </Badge>
                        )}
                        <div>{competitor.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <motion.tr
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      onHoverStart={() => setHoveredFeature(feature)}
                      onHoverEnd={() => setHoveredFeature(null)}
                      className={`border-b transition-colors ${
                        hoveredFeature === feature
                          ? 'bg-blue-50 dark:bg-blue-900/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="p-4 font-medium">{feature}</td>
                      {competitors.map((competitor) => {
                        const value = competitor.features[feature];
                        const isSettler = competitor.name === 'Settler';
                        const isTrue = value === true;
                        const isString = typeof value === 'string';

                        return (
                          <td
                            key={`${competitor.name}-${feature}`}
                            className={`text-center p-4 ${
                              isSettler && isTrue
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                                : ''
                            }`}
                          >
                            {isTrue ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                              >
                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
                              </motion.div>
                            ) : isString ? (
                              <Badge variant="outline" className="text-xs">
                                {String(value)}
                              </Badge>
                            ) : (
                              <XCircle className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            * AI Analysis available on Pro and Enterprise tiers. Free tier includes 1 analysis per week.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
