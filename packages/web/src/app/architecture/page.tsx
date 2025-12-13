'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ZoomIn } from 'lucide-react';
import { brandImages, getBrandImage, getBrandImageAlt, getBrandImageDimensions } from '@/lib/images';

const Lightbox = dynamic(() => import("@/components/marketing/Lightbox").then(mod => ({ default: mod.Lightbox })), { ssr: false });
const SafeImage = dynamic(() => import("@/components/marketing/SafeImage").then(mod => ({ default: mod.SafeImage })), { ssr: true });

export default function ArchitecturePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <AnimatedPageWrapper aria-label="Architecture page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'Architecture' }]} />
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Built for Financial Correctness
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Settler uses a double-entry ledger core, event-sourced reconciliation engine, 
            and edge-optimized API gateway to ensure performance and accuracy.
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <SpotlightCard
            className="p-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
            aria-label="View architecture diagram in full screen"
          >
            <div className="relative aspect-video">
              <SafeImage
                src={getBrandImage('architecture')}
                fallbackSrc={brandImages.architecture.fallback}
                alt={getBrandImageAlt('architecture')}
                fill
                className="object-contain bg-slate-50 dark:bg-slate-900"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg mb-4">
                  <ZoomIn className="w-5 h-5" />
                  <span className="font-semibold">Click to view full size</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
          <Lightbox
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            src={getBrandImage('architecture')}
            fallbackSrc={brandImages.architecture.fallback}
            alt={getBrandImageAlt('architecture')}
            title="Settler Architecture"
            description="Event-sourced reconciliation engine with edge-optimized API gateway and distributed data store"
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">Event Sourcing</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Every action is recorded as an immutable event. We can replay history 
              to re-calculate balances or audit changes with 100% fidelity.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Idempotency Keys</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Network failures shouldn't cause double charges. Our API enforces 
              strict idempotency across all state-changing operations.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Edge Execution</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Feature flags and read-heavy operations run on the edge, closest 
              to your users, ensuring minimal latency overhead.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
