/**
 * Feature Grid Block Component
 * 
 * Renders a grid of feature cards.
 */

'use client';

import { FeatureGridBlock } from '../pageSchema';
import { cn } from '@/lib/utils';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import Image from 'next/image';

interface FeatureGridBlockComponentProps {
  block: FeatureGridBlock;
}

export function FeatureGridBlockComponent({ block }: FeatureGridBlockComponentProps) {
  const columns = block.columns || 3;
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby={`features-${block.id}`}>
      <div className="max-w-7xl mx-auto">
        {block.title && (
          <h2 id={`features-${block.id}`} className="text-3xl md:text-4xl font-bold mb-4 text-center">
            {block.title}
          </h2>
        )}
        
        {block.description && (
          <p className="text-lg text-muted-foreground mb-16 text-center max-w-2xl mx-auto">
            {block.description}
          </p>
        )}
        
        <div className={cn('grid gap-8', gridCols)}>
          {block.features.map((feature, index) => (
            <SpotlightCard key={index} className="p-6 h-full">
              {feature.icon && (
                <div className="w-12 h-12 mb-4 flex items-center justify-center">
                  <span className="text-4xl">{feature.icon}</span>
                </div>
              )}
              {feature.image && (
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={48}
                  height={48}
                  className="w-12 h-12 mb-4 object-contain"
                />
              )}
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
