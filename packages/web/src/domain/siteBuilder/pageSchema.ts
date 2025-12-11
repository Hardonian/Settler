import { z } from 'zod';

// ============================================================================
// Base Block Schema
// ============================================================================

export const BaseBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  visible: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

// ============================================================================
// Block Schemas
// ============================================================================

export const HeroBlockSchema = BaseBlockSchema.extend({
  type: z.literal('hero'),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  primaryCta: z.object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(['primary', 'secondary', 'outline']).optional(),
  }).optional(),
  secondaryCta: z.object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(['primary', 'secondary', 'outline']).optional(),
  }).optional(),
  backgroundImage: z.string().optional(),
  backgroundGradient: z.string().optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
});

export const FeatureGridBlockSchema = BaseBlockSchema.extend({
  type: z.literal('featureGrid'),
  title: z.string().optional(),
  description: z.string().optional(),
  columns: z.number().optional().default(3),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
    image: z.string().optional(),
  })),
});

export const LogoCloudBlockSchema = BaseBlockSchema.extend({
  type: z.literal('logoCloud'),
  title: z.string().optional(),
  logos: z.array(z.object({
    name: z.string(),
    imageUrl: z.string(),
    href: z.string().optional(),
  })),
  columns: z.number().optional().default(5),
});

export const TestimonialBlockSchema = BaseBlockSchema.extend({
  type: z.literal('testimonial'),
  testimonials: z.array(z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    avatar: z.string().optional(),
  })),
  layout: z.enum(['grid', 'carousel', 'single']).optional().default('grid'),
});

export const FAQBlockSchema = BaseBlockSchema.extend({
  type: z.literal('faq'),
  title: z.string().optional(),
  items: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  layout: z.enum(['accordion', 'grid']).optional().default('accordion'),
});

export const CTABannerBlockSchema = BaseBlockSchema.extend({
  type: z.literal('ctaBanner'),
  title: z.string(),
  description: z.string().optional(),
  primaryCta: z.object({
    label: z.string(),
    href: z.string(),
  }),
  secondaryCta: z.object({
    label: z.string(),
    href: z.string(),
  }).optional(),
  variant: z.enum(['default', 'gradient', 'outlined']).optional().default('default'),
});

export const PricingTableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('pricingTable'),
  title: z.string().optional(),
  description: z.string().optional(),
  plans: z.array(z.object({
    name: z.string(),
    price: z.string(),
    period: z.string().optional(),
    description: z.string().optional(),
    features: z.array(z.string()),
    cta: z.object({
      label: z.string(),
      href: z.string(),
    }),
    popular: z.boolean().optional(),
    badge: z.string().optional(),
  })),
  showBillingToggle: z.boolean().optional().default(true),
});

export const TwoColumnTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('twoColumnText'),
  leftColumn: z.object({
    title: z.string().optional(),
    content: z.string(),
  }),
  rightColumn: z.object({
    title: z.string().optional(),
    content: z.string(),
  }),
  reverse: z.boolean().optional().default(false),
});

export const CodeExampleBlockSchema = BaseBlockSchema.extend({
  type: z.literal('codeExample'),
  title: z.string().optional(),
  description: z.string().optional(),
  code: z.string(),
  language: z.string().optional().default('typescript'),
  showLineNumbers: z.boolean().optional().default(true),
});

export const StatsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('stats'),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })),
  columns: z.number().optional().default(4),
});

export const FooterBlockSchema = BaseBlockSchema.extend({
  type: z.literal('footer'),
  columns: z.array(z.object({
    title: z.string(),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  })),
  socialLinks: z.array(z.object({
    platform: z.enum(['twitter', 'github', 'linkedin', 'facebook', 'instagram', 'youtube']),
    href: z.string(),
  })).optional(),
  copyright: z.string().optional(),
});

export const CustomHTMLBlockSchema = BaseBlockSchema.extend({
  type: z.literal('customHTML'),
  html: z.string(),
  sanitized: z.boolean().optional().default(true),
});

// ============================================================================
// Union Type & Types
// ============================================================================

export const PageBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  FeatureGridBlockSchema,
  LogoCloudBlockSchema,
  TestimonialBlockSchema,
  FAQBlockSchema,
  CTABannerBlockSchema,
  PricingTableBlockSchema,
  TwoColumnTextBlockSchema,
  CodeExampleBlockSchema,
  StatsBlockSchema,
  FooterBlockSchema,
  CustomHTMLBlockSchema,
]);

export type PageBlock = z.infer<typeof PageBlockSchema>;
export type HeroBlock = z.infer<typeof HeroBlockSchema>;
export type FeatureGridBlock = z.infer<typeof FeatureGridBlockSchema>;
export type LogoCloudBlock = z.infer<typeof LogoCloudBlockSchema>;
export type TestimonialBlock = z.infer<typeof TestimonialBlockSchema>;
export type FAQBlock = z.infer<typeof FAQBlockSchema>;
export type CTABannerBlock = z.infer<typeof CTABannerBlockSchema>;
export type PricingTableBlock = z.infer<typeof PricingTableBlockSchema>;
export type TwoColumnTextBlock = z.infer<typeof TwoColumnTextBlockSchema>;
export type CodeExampleBlock = z.infer<typeof CodeExampleBlockSchema>;
export type StatsBlock = z.infer<typeof StatsBlockSchema>;
export type FooterBlock = z.infer<typeof FooterBlockSchema>;
export type CustomHTMLBlock = z.infer<typeof CustomHTMLBlockSchema>;

// ============================================================================
// Defaults
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
  const result = PageBlockSchema.safeParse(block);
  if (result.success) {
    return result.data;
  }
  // In development, log the validation error
  if (process.env.NODE_ENV === 'development') {
    console.warn('Block validation failed:', result.error);
  }
  return null;
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
