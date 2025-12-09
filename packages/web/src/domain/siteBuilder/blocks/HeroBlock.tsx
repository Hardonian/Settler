/**
 * Hero Block Component
 * 
 * Renders a hero section with title, description, and CTAs.
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroBlock } from '../pageSchema';
import { cn } from '@/lib/utils';

interface HeroBlockComponentProps {
  block: HeroBlock;
}

export function HeroBlockComponent({ block }: HeroBlockComponentProps) {
  const alignment = block.alignment || 'center';
  const hasBackground = block.backgroundImage || block.backgroundGradient;

  return (
    <section
      className={cn(
        'relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center',
        hasBackground && 'bg-cover bg-center'
      )}
      style={{
        backgroundImage: block.backgroundImage ? `url(${block.backgroundImage})` : undefined,
        background: block.backgroundGradient || undefined,
      }}
      aria-labelledby={`hero-${block.id}`}
    >
      {block.backgroundGradient && (
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: block.backgroundGradient }}
          aria-hidden="true"
        />
      )}
      
      <div className={cn(
        'max-w-7xl mx-auto relative z-10 w-full',
        alignment === 'center' && 'text-center',
        alignment === 'left' && 'text-left',
        alignment === 'right' && 'text-right'
      )}>
        <h1
          id={`hero-${block.id}`}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
        >
          {block.title}
        </h1>
        
        {block.subtitle && (
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
            {block.subtitle}
          </p>
        )}
        
        {block.description && (
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {block.description}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {block.primaryCta && (
            <Button size="lg" asChild>
              <Link href={block.primaryCta.href}>
                {block.primaryCta.label}
              </Link>
            </Button>
          )}
          
          {block.secondaryCta && (
            <Button size="lg" variant={block.secondaryCta.variant || 'outline'} asChild>
              <Link href={block.secondaryCta.href}>
                {block.secondaryCta.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
