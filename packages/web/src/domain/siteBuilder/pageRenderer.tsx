/**
 * Page Renderer
 * 
 * Renders a TenantPage from its blocks configuration.
 * Switches on block.type and renders the appropriate component.
 */

'use client';

import React from 'react';
import { PageBlock, validateBlock } from './pageSchema';
import { HeroBlockComponent } from './blocks/HeroBlock';
import { FeatureGridBlockComponent } from './blocks/FeatureGridBlock';
import { LogoCloudBlockComponent } from './blocks/LogoCloudBlock';
import { TestimonialBlockComponent } from './blocks/TestimonialBlock';
import { FAQBlockComponent } from './blocks/FAQBlock';
import { CTABannerBlockComponent } from './blocks/CTABannerBlock';
import { PricingTableBlockComponent } from './blocks/PricingTableBlock';
import { TwoColumnTextBlockComponent } from './blocks/TwoColumnTextBlock';
import { CodeExampleBlockComponent } from './blocks/CodeExampleBlock';
import { StatsBlockComponent } from './blocks/StatsBlock';

interface PageRendererProps {
  blocks: unknown[]; // JSON blocks from TenantPage
  className?: string;
}

/**
 * Block component registry
 */
const blockComponents: Record<string, React.ComponentType<{ block: PageBlock }>> = {
  hero: HeroBlockComponent,
  featureGrid: FeatureGridBlockComponent,
  logoCloud: LogoCloudBlockComponent,
  testimonial: TestimonialBlockComponent,
  faq: FAQBlockComponent,
  ctaBanner: CTABannerBlockComponent,
  pricingTable: PricingTableBlockComponent,
  twoColumnText: TwoColumnTextBlockComponent,
  codeExample: CodeExampleBlockComponent,
  stats: StatsBlockComponent,
};

export function PageRenderer({ blocks, className }: PageRendererProps) {
  const validBlocks = React.useMemo(() => {
    return blocks
      .map((block) => validateBlock(block))
      .filter((block): block is PageBlock => block !== null && (block.visible !== false));
  }, [blocks]);

  return (
    <div className={className}>
      {validBlocks.map((block, index) => {
        const BlockComponent = blockComponents[block.type];
        
        if (!BlockComponent) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }

        return (
          <React.Fragment key={block.id || `block-${index}`}>
            <BlockComponent block={block} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Render a single block (for preview/editing)
 */
export function BlockRenderer({ block }: { block: unknown }) {
  const validatedBlock = validateBlock(block);
  
  if (!validatedBlock) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded">
        <p className="text-red-600">Invalid block configuration</p>
      </div>
    );
  }

  const BlockComponent = blockComponents[validatedBlock.type];
  
  if (!BlockComponent) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
        <p className="text-yellow-600">Unknown block type: {validatedBlock.type}</p>
      </div>
    );
  }

  return <BlockComponent block={validatedBlock} />;
}
