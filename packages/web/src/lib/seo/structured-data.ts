/**
 * Enhanced Structured Data (JSON-LD) for SEO
 * Implements Schema.org markup for better search engine understanding
 */

import { getImageUrl } from '@/lib/images/image-config';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';

/**
 * Product schema for Settler API
 */
export function generateProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Settler OSS Reconciliation Engine',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    description:
      'Open-source reconciliation engine that normalizes financial data, applies explicit rules, and surfaces variances for review.',
    url: baseUrl,
    downloadUrl: 'https://www.npmjs.com/package/@settler/sdk',
    screenshot: getImageUrl('ogImage'),
    featureList: [
      'Deterministic reconciliation rules',
      'Provider-agnostic adapters',
      'Variance reporting with evidence',
      'Inspectability and replay',
      'Human-in-the-loop workflows',
    ],
    applicationSubCategory: 'Financial Technology',
    softwareVersion: '1.0.0',
    releaseNotes: `${baseUrl}/changelog`,
  };
}

/**
 * Breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Article schema for blog posts
 */
export function generateArticleSchema({
  title,
  description,
  author,
  publishedDate,
  modifiedDate,
  image,
  url,
}: {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  image?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || getImageUrl('ogImage'),
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Settler',
      logo: {
        '@type': 'ImageObject',
        url: getImageUrl('logoMain'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${url}`,
    },
  };
}

/**
 * HowTo schema for tutorials
 */
export function generateHowToSchema({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: step.image,
      }),
    })),
  };
}

/**
 * Video schema for demo videos
 */
export function generateVideoSchema({
  name,
  description,
  thumbnailUrl,
  contentUrl,
  embedUrl,
  duration,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  embedUrl: string;
  duration: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    contentUrl,
    embedUrl,
    duration,
    uploadDate: new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'Settler',
      logo: {
        '@type': 'ImageObject',
        url: getImageUrl('logoMain'),
      },
    },
  };
}

/**
 * Review schema for testimonials
 */
export function generateReviewSchema({
  author,
  rating,
  reviewBody,
  datePublished,
}: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody,
    datePublished,
  };
}

/**
 * Service schema for API services
 */
export function generateServiceSchema({
  name,
  description,
  serviceType,
  areaServed,
  provider,
}: {
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string;
  provider?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    provider: provider || {
      '@type': 'Organization',
      name: 'Settler',
      url: baseUrl,
    },
    ...(areaServed && {
      areaServed: {
        '@type': 'Country',
        name: areaServed,
      },
    }),
  };
}
