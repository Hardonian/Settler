import { Metadata } from "next";
import { getImageUrl, SETTLER_IMAGES } from "@/lib/images/image-config";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

/**
 * Generate dynamic metadata for pages
 * Improves SEO with page-specific meta tags
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage = SETTLER_IMAGES.ogImage.path,
  canonical,
  noindex = false,
}: PageMetadata): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev";
  const fullTitle = title.includes("Settler") ? title : `${title} | Settler`;
  // canonical should always be provided by the caller for server components
  const canonicalUrl = canonical || siteUrl;

  const defaultKeywords = [
    "reconciliation API",
    "financial reconciliation",
    "data reconciliation",
    "SaaS reconciliation",
    "e-commerce reconciliation",
    "payment reconciliation",
    "Stripe reconciliation",
    "Shopify reconciliation",
    "API integration",
    "financial automation",
  ];

  return {
    title: {
      default: fullTitle,
      template: "%s | Settler",
    },
    description,
    keywords: [...defaultKeywords, ...keywords],
    authors: [{ name: "Settler" }],
    creator: "Settler",
    publisher: "Settler",
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName: "Settler",
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`],
      creator: "@settler_io",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Generate pricing-specific metadata with FAQ schema support
 */
export function generatePricingMetadata(): Metadata {
  return generateMetadata({
    title: "Pricing - Simple, Transparent Plans",
    description:
      "Start your 30-day free trial with full access to all features. No credit card required. Plans from $0/month for small businesses to custom enterprise solutions.",
    keywords: [
      "reconciliation pricing",
      "API pricing",
      "financial reconciliation cost",
      "reconciliation software pricing",
      "free trial",
    ],
    canonical: "https://settler.dev/pricing",
  });
}

/**
 * Generate docs-specific metadata
 */
export function generateDocsMetadata(section?: string): Metadata {
  const title = section ? `${section} - Documentation` : "Documentation - API Reference & Guides";
  return generateMetadata({
    title,
    description:
      "Complete API documentation, guides, and examples for integrating Settler into your application. Get started in minutes with our comprehensive developer resources.",
    keywords: [
      "API documentation",
      "developer docs",
      "reconciliation API docs",
      "integration guide",
      "API reference",
    ],
    canonical: section ? `https://settler.dev/docs/${section}` : "https://settler.dev/docs",
  });
}

/**
 * Generate integration-specific metadata
 */
export function generateIntegrationMetadata(integrationName: string): Metadata {
  return generateMetadata({
    title: `${integrationName} Integration - Settler`,
    description: `Connect ${integrationName} with Settler to automatically reconcile transactions across platforms. Set up in 5 minutes with our pre-built adapter.`,
    keywords: [
      `${integrationName} reconciliation`,
      `${integrationName} integration`,
      `reconcile ${integrationName}`,
      `${integrationName} API`,
    ],
    canonical: `https://settler.dev/integrations/${integrationName.toLowerCase()}`,
  });
}
