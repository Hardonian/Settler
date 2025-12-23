/**
 * Feature Showcase Component
 * 
 * Modern, animated showcase of Settler's core features.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/SafeImage';
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
  link: string;
  color: string;
  gradient: string;
  screenshot?: string;
}

const features: Feature[] = [
  {
    id: 'meaningful-changes',
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Meaningful Changes',
    description: 'See what changed with impact ranking and explanations. Not raw diffs—actual insights.',
    highlight: 'Ranked by urgency, impact, and confidence',
    link: '/console/changes',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    screenshot: '/assets/images/1766446412895.jpg',
  },
  {
    id: 'reconciliation',
    icon: <RefreshCw className="w-8 h-8" />,
    title: 'Smart Reconciliation',
    description: 'Actionable reconciliation ranked by impact. Know what matters, why it matters, and what to do.',
    highlight: 'Impact-first ranking with risk scoring',
    link: '/console/reconciliation-view',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    screenshot: '/assets/images/1766446421153.jpg',
  },
  {
    id: 'receipts',
    icon: <Shield className="w-8 h-8" />,
    title: 'Tamper-Evident Receipts',
    description: 'Audit-ready receipts with hash chain integrity. Boring, perfect, immutable.',
    highlight: 'SHA256 hash chain verification',
    link: '/console/receipts-hash',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    screenshot: '/assets/images/1766446442563.jpg',
  },
  {
    id: 'alerts',
    icon: <AlertTriangle className="w-8 h-8" />,
    title: 'Intelligent Alerts',
    description: 'Rare, relevant, explained. Alerts that tell you why they triggered and what to do next.',
    highlight: 'Threshold tracking with explanations',
    link: '/console/alerts-view',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    screenshot: '/assets/images/1766446446143.jpg',
  },
  {
    id: 'ai-analysis',
    icon: <Sparkles className="w-8 h-8" />,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI analysis for deeper insights. Understand patterns, predict issues, get recommendations.',
    highlight: 'Growth & Enterprise tiers with token management',
    link: '/console/ai-analysis',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    screenshot: '/assets/images/1766446457350.jpg',
  },
];

export function FeatureShowcase() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Core Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Certainty at Decision Speed
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Every feature serves: reduce uncertainty, detect change, prescribe action, prove it later.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const ref = useRef(null);
            const isInView = useInView(ref, { once: true, margin: '-100px' });
            const controls = useAnimation();

            useEffect(() => {
              if (isInView) {
                controls.start('visible');
              }
            }, [isInView, controls]);

            return (
              <motion.div
                key={feature.id}
                ref={ref}
                initial="hidden"
                animate={controls}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.5 },
                  },
                }}
                onHoverStart={() => setHoveredFeature(feature.id)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card
                  className={`relative overflow-hidden h-full transition-all duration-300 ${
                    hoveredFeature === feature.id
                      ? 'shadow-2xl scale-105 border-2'
                      : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 ${
                      hoveredFeature === feature.id ? 'opacity-5' : ''
                    }`}
                  />
                  <CardContent className="p-6 relative z-10">
                    {feature.screenshot && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <div className="relative w-full aspect-[512/279]">
                          <SafeImage
                            src={feature.screenshot}
                            alt={`${feature.title} - UI screenshot`}
                            width={512}
                            height={279}
                            className="w-full h-full object-contain"
                            fallbackTitle={feature.title}
                            fallbackCaption={feature.description}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <motion.div
                      animate={{
                        rotate: hoveredFeature === feature.id ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} text-white mb-4`}
                    >
                      {feature.icon}
                    </motion.div>

                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {feature.description}
                    </p>

                    <Badge
                      variant="outline"
                      className={`mb-4 border-${feature.color}-200 text-${feature.color}-700 dark:border-${feature.color}-800 dark:text-${feature.color}-400`}
                    >
                      {feature.highlight}
                    </Badge>

                    <motion.div whileHover={{ x: 5 }}>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full group"
                      >
                        <Link href={feature.link}>
                          Explore Feature
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Link href="/console">
              Start Using Settler
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
