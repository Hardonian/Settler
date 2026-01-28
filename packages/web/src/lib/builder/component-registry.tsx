/**
 * Builder.io Component Registry
 * Registers custom components for use in Builder.io visual editor
 */

import { Builder } from '@builder.io/react';
import dynamic from 'next/dynamic';

// Dynamically import components for better performance
const AnimatedCodeBlock = dynamic(
  () => import('@/components/AnimatedCodeBlock').then((mod) => mod.AnimatedCodeBlock),
  { ssr: false }
);
const AnimatedFeatureCard = dynamic(
  () => import('@/components/AnimatedFeatureCard').then((mod) => mod.AnimatedFeatureCard)
);
const ConversionCTA = dynamic(
  () => import('@/components/ConversionCTA').then((mod) => mod.ConversionCTA)
);
const EnhancedConversionCTA = dynamic(
  () => import('@/components/EnhancedConversionCTA').then((mod) => mod.EnhancedConversionCTA)
);
const EnhancedTrustBadges = dynamic(
  () => import('@/components/EnhancedTrustBadges').then((mod) => mod.EnhancedTrustBadges)
);
const CustomerTestimonials = dynamic(
  () => import('@/components/CustomerTestimonials').then((mod) => mod.CustomerTestimonials)
);
const IntegrationLogos = dynamic(
  () => import('@/components/IntegrationLogos').then((mod) => mod.IntegrationLogos)
);

/**
 * Register all custom components with Builder.io
 * This makes them available in the visual editor
 */
export function registerBuilderComponents() {
  // Register Animated Code Block
  Builder.registerComponent(AnimatedCodeBlock, {
    name: 'AnimatedCodeBlock',
    inputs: [
      {
        name: 'code',
        type: 'longText',
        defaultValue: 'console.log("Hello World");',
        required: true,
      },
      {
        name: 'language',
        type: 'string',
        defaultValue: 'typescript',
        enum: ['typescript', 'javascript', 'python', 'json', 'bash'],
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: 'Example Code',
      },
    ],
  });

  // Register Feature Card
  Builder.registerComponent(AnimatedFeatureCard, {
    name: 'FeatureCard',
    inputs: [
      {
        name: 'icon',
        type: 'string',
        defaultValue: 'Zap',
        helperText: 'Lucide icon name',
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        defaultValue: 'Feature Title',
      },
      {
        name: 'description',
        type: 'longText',
        required: true,
        defaultValue: 'Feature description goes here',
      },
    ],
  });

  // Register Conversion CTA
  Builder.registerComponent(ConversionCTA, {
    name: 'ConversionCTA',
    inputs: [
      {
        name: 'variant',
        type: 'string',
        enum: ['default', 'gradient', 'minimal'],
        defaultValue: 'default',
      },
      {
        name: 'heading',
        type: 'string',
        defaultValue: 'Ready to get started?',
      },
      {
        name: 'subheading',
        type: 'longText',
        defaultValue: 'Start your free trial today',
      },
      {
        name: 'primaryCTA',
        type: 'object',
        subFields: [
          { name: 'text', type: 'string', defaultValue: 'Start Free Trial' },
          { name: 'href', type: 'string', defaultValue: '/signup' },
        ],
      },
      {
        name: 'secondaryCTA',
        type: 'object',
        subFields: [
          { name: 'text', type: 'string', defaultValue: 'View Pricing' },
          { name: 'href', type: 'string', defaultValue: '/pricing' },
        ],
      },
    ],
  });

  // Register Enhanced Conversion CTA
  Builder.registerComponent(EnhancedConversionCTA, {
    name: 'EnhancedConversionCTA',
    inputs: [
      {
        name: 'heading',
        type: 'string',
        defaultValue: 'Start reconciling in minutes',
      },
      {
        name: 'subheading',
        type: 'longText',
        defaultValue: 'No credit card required. Cancel anytime.',
      },
      {
        name: 'showTrustBadges',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'showUrgency',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  });

  // Register Trust Badges
  Builder.registerComponent(EnhancedTrustBadges, {
    name: 'TrustBadges',
    inputs: [
      {
        name: 'variant',
        type: 'string',
        enum: ['default', 'minimal', 'detailed'],
        defaultValue: 'default',
      },
      {
        name: 'badges',
        type: 'list',
        subFields: [
          { name: 'icon', type: 'string', defaultValue: 'Shield' },
          { name: 'text', type: 'string', defaultValue: 'SOC 2 Compliant' },
        ],
      },
    ],
  });

  // Register Customer Testimonials
  Builder.registerComponent(CustomerTestimonials, {
    name: 'CustomerTestimonials',
    inputs: [
      {
        name: 'testimonials',
        type: 'list',
        subFields: [
          { name: 'quote', type: 'longText', required: true },
          { name: 'author', type: 'string', required: true },
          { name: 'role', type: 'string', required: true },
          { name: 'company', type: 'string', required: true },
          { name: 'avatar', type: 'file' },
        ],
        defaultValue: [
          {
            quote: 'Settler saved us 40 hours per month on reconciliation.',
            author: 'John Doe',
            role: 'CFO',
            company: 'Acme Corp',
          },
        ],
      },
    ],
  });

  // Register Integration Logos
  Builder.registerComponent(IntegrationLogos, {
    name: 'IntegrationLogos',
    inputs: [
      {
        name: 'title',
        type: 'string',
        defaultValue: 'Integrates with your favorite tools',
      },
      {
        name: 'logos',
        type: 'list',
        subFields: [
          { name: 'name', type: 'string', required: true },
          { name: 'logo', type: 'file', required: true },
          { name: 'url', type: 'string' },
        ],
      },
    ],
  });

  // Register basic UI components
  Builder.registerComponent(
    (props: { text: string; variant: 'default' | 'outline' | 'ghost'; href?: string }) => {
      const buttonClass = `
        px-6 py-3 rounded-lg font-semibold transition-all
        ${props.variant === 'default' ? 'bg-primary text-white hover:bg-primary/90' : ''}
        ${props.variant === 'outline' ? 'border-2 border-primary text-primary hover:bg-primary/10' : ''}
        ${props.variant === 'ghost' ? 'text-primary hover:bg-primary/10' : ''}
      `;

      if (props.href) {
        return <a href={props.href} className={buttonClass}>{props.text}</a>;
      }
      return <button className={buttonClass}>{props.text}</button>;
    },
    {
      name: 'Button',
      inputs: [
        { name: 'text', type: 'string', defaultValue: 'Click me', required: true },
        { name: 'variant', type: 'string', enum: ['default', 'outline', 'ghost'], defaultValue: 'default' },
        { name: 'href', type: 'url' },
      ],
    }
  );

  console.log('✅ Builder.io components registered successfully');
}

// Auto-register components when this module is imported
if (typeof window !== 'undefined') {
  registerBuilderComponents();
}
