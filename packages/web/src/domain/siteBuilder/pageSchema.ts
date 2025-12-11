/**
 * Page Block Schema
 * 
 * Defines the schema for block-based pages.
 * Each block type has a TypeScript type and a React component.
 * 
 * Note: Using manual validation instead of zod for now.
 * Can be migrated to zod or @settler/protocol validation later.
 */

// ============================================================================
// Block Type Definitions
// ============================================================================

/**
 * Type definitions for page blocks
 */

// Base block interface
export interface BaseBlock {
  id: string;
  type: string;
  visible?: boolean;
  metadata?: Record<string, unknown>;
}

// Hero block
export interface HeroBlock extends BaseBlock {
  type: 'hero';
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryCta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  backgroundImage?: string;
  backgroundGradient?: string;
  alignment?: 'left' | 'center' | 'right';
}

// Feature grid block
export interface FeatureGridBlock extends BaseBlock {
  type: 'featureGrid';
  title?: string;
  description?: string;
  columns?: number;
  features: Array<{
    title: string;
    description: string;
    icon?: string;
    image?: string;
  }>;
}

// Logo cloud block
export interface LogoCloudBlock extends BaseBlock {
  type: 'logoCloud';
  title?: string;
  logos: Array<{
    name: string;
    imageUrl: string;
    href?: string;
  }>;
  columns?: number;
}

// Testimonial block
export interface TestimonialBlock extends BaseBlock {
  type: 'testimonial';
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatar?: string;
  }>;
  layout?: 'grid' | 'carousel' | 'single';
}

// FAQ block
export interface FAQBlock extends BaseBlock {
  type: 'faq';
  title?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
  layout?: 'accordion' | 'grid';
}

// CTA banner block
export interface CTABannerBlock extends BaseBlock {
  type: 'ctaBanner';
  title: string;
  description?: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  variant?: 'default' | 'gradient' | 'outlined';
}

// Pricing table block
export interface PricingTableBlock extends BaseBlock {
  type: 'pricingTable';
  title?: string;
  description?: string;
  plans: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features: string[];
    cta: {
      label: string;
      href: string;
    };
    popular?: boolean;
    badge?: string;
  }>;
  showBillingToggle?: boolean;
}

// Two column text block
export interface TwoColumnTextBlock extends BaseBlock {
  type: 'twoColumnText';
  leftColumn: {
    title?: string;
    content: string;
  };
  rightColumn: {
    title?: string;
    content: string;
  };
  reverse?: boolean;
}

// Code example block
export interface CodeExampleBlock extends BaseBlock {
  type: 'codeExample';
  title?: string;
  description?: string;
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

// Stats block
export interface StatsBlock extends BaseBlock {
  type: 'stats';
  stats: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  columns?: number;
}

// Footer block
export interface FooterBlock extends BaseBlock {
  type: 'footer';
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
  socialLinks?: Array<{
    platform: 'twitter' | 'github' | 'linkedin' | 'facebook' | 'instagram' | 'youtube';
    href: string;
  }>;
  copyright?: string;
}

// Custom HTML block (sanitized)
export interface CustomHTMLBlock extends BaseBlock {
  type: 'customHTML';
  html: string;
  sanitized?: boolean;
}

// Union type for all blocks
export type PageBlock =
  | HeroBlock
  | FeatureGridBlock
  | LogoCloudBlock
  | TestimonialBlock
  | FAQBlock
  | CTABannerBlock
  | PricingTableBlock
  | TwoColumnTextBlock
  | CodeExampleBlock
  | StatsBlock
  | FooterBlock
  | CustomHTMLBlock;

// ============================================================================
// Safe defaults for each block type
// ============================================================================

export const blockDefaults: Record<string, Partial<PageBlock>> = {
  hero: {
    type: 'hero',
    id: '',
    visible: true,
    title: 'Welcome',
    alignment: 'center',
    metadata: {},
  },
  featureGrid: {
    type: 'featureGrid',
    id: '',
    visible: true,
    columns: 3,
    features: [],
    metadata: {},
  },
  logoCloud: {
    type: 'logoCloud',
    id: '',
    visible: true,
    columns: 5,
    logos: [],
    metadata: {},
  },
  testimonial: {
    type: 'testimonial',
    id: '',
    visible: true,
    layout: 'grid',
    testimonials: [],
    metadata: {},
  },
  faq: {
    type: 'faq',
    id: '',
    visible: true,
    layout: 'accordion',
    items: [],
    metadata: {},
  },
  ctaBanner: {
    type: 'ctaBanner',
    id: '',
    visible: true,
    title: 'Get Started',
    variant: 'default',
    metadata: {},
  },
  pricingTable: {
    type: 'pricingTable',
    id: '',
    visible: true,
    showBillingToggle: true,
    plans: [],
    metadata: {},
  },
  twoColumnText: {
    type: 'twoColumnText',
    id: '',
    visible: true,
    reverse: false,
    leftColumn: { content: '' },
    rightColumn: { content: '' },
    metadata: {},
  },
  codeExample: {
    type: 'codeExample',
    id: '',
    visible: true,
    language: 'typescript',
    code: '',
    showLineNumbers: true,
    metadata: {},
  },
  stats: {
    type: 'stats',
    id: '',
    visible: true,
    columns: 4,
    stats: [],
    metadata: {},
  },
  footer: {
    type: 'footer',
    id: '',
    visible: true,
    columns: [],
    metadata: {},
  },
  customHTML: {
    type: 'customHTML',
    id: '',
    visible: true,
    html: '',
    sanitized: true,
    metadata: {},
  },
};

/**
 * Validate and sanitize a block
 */
export function validateBlock(block: unknown): PageBlock | null {
  if (!block || typeof block !== 'object') {
    return null;
  }

  const obj = block as Record<string, unknown>;
  
  // Must have type and id
  if (!obj.type || typeof obj.type !== 'string') {
    return null;
  }
  
  if (!obj.id || typeof obj.id !== 'string') {
    return null;
  }

  // Basic type checking - full validation can be added later
  // For now, trust the structure and apply defaults
  const validated = {
    ...obj,
    visible: obj.visible !== false, // default to true
    metadata: obj.metadata || {},
  } as PageBlock;

  return validated;
}

/**
 * Get safe default for a block type
 */
export function getBlockDefault(type: string): Partial<PageBlock> {
  return blockDefaults[type] || {
    type: type as any,
    id: '',
    visible: true,
    metadata: {},
  };
}
