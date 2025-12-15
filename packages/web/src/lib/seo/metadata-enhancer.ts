/**
 * Metadata Enhancer
 * Enhances page metadata for better SEO
 */

import { Metadata } from 'next';
import { generateMetadata as baseGenerateMetadata } from '@/lib/metadata';

interface EnhancedMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: Record<string, any>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * Generate enhanced metadata with structured data
 */
export function generateEnhancedMetadata({
  title,
  description,
  keywords = [],
  ogImage,
  canonical,
  noindex = false,
}: EnhancedMetadataOptions): Metadata {
  const baseMetadata = baseGenerateMetadata({
    title,
    description,
    keywords,
    ogImage,
    canonical,
    noindex,
  });

  // Add additional SEO enhancements
  return {
    ...baseMetadata,
    // Add more specific metadata
    alternates: {
      ...baseMetadata.alternates,
      canonical: canonical || baseMetadata.alternates?.canonical,
    },
    // Add category for content organization
    category: 'Financial Technology',
    // Add application name for PWA
    applicationName: 'Settler',
    // Add referrer policy
    referrer: 'strict-origin-when-cross-origin',
  };
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogMetadata({
  title,
  description,
  author,
  publishedDate,
  modifiedDate,
  image,
  slug,
}: {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  image?: string;
  slug: string;
}): Metadata {
  const canonical = `/blog/${slug}`;
  
  return generateEnhancedMetadata({
    title,
    description,
    keywords: ['financial reconciliation', 'API', 'developer tools', 'fintech'],
    ogImage: image,
    canonical,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      image: image,
      datePublished: publishedDate,
      dateModified: modifiedDate || publishedDate,
      author: {
        '@type': 'Person',
        name: author,
      },
    },
  });
}

/**
 * Generate metadata for documentation pages
 */
export function generateDocsMetadata({
  title,
  description,
  section,
  slug,
}: {
  title: string;
  description: string;
  section?: string;
  slug: string;
}): Metadata {
  const canonical = section ? `/docs/${section}/${slug}` : `/docs/${slug}`;
  
  return generateEnhancedMetadata({
    title,
    description,
    keywords: ['API documentation', 'developer docs', 'integration guide'],
    canonical,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: title,
      description,
      about: {
        '@type': 'SoftwareApplication',
        name: 'Settler API',
      },
    },
  });
}
