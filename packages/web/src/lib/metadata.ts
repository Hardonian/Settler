import { Metadata } from "next";
import { SETTLER_IMAGES } from "@/lib/images/image-config";

const getDefaultSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.OSS_SITE_URL || "https://settler.dev";

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
  const siteUrl = getDefaultSiteUrl();
  const fullTitle = title.includes("Settler") ? title : `${title} | Settler`;
  // canonical should always be provided by the caller for server components
  const canonicalUrl = canonical || siteUrl;

  const defaultKeywords = [
    "reconciliation engine",
    "financial reconciliation",
    "deterministic reconciliation",
    "variance detection",
    "provider-agnostic adapters",
    "rules-based reconciliation",
    "open source finance",
    "audit evidence",
    "data normalization",
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
    title: "Enterprise - Hosted Infrastructure",
    description:
      "Optional hosted infrastructure for organizations that want managed deployment and scale without changing core reconciliation logic.",
    keywords: ["enterprise hosting", "managed reconciliation", "infrastructure scale"],
    canonical: `${getDefaultSiteUrl()}/enterprise`,
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
      "Developer documentation, quickstart guides, and determinism notes for integrating Settler into reconciliation workflows.",
    keywords: [
      "API documentation",
      "developer docs",
      "reconciliation API docs",
      "integration guide",
      "API reference",
    ],
    canonical: section ? `${getDefaultSiteUrl()}/docs/${section}` : `${getDefaultSiteUrl()}/docs`,
  });
}

/**
 * Generate integration-specific metadata
 */
export function generateIntegrationMetadata(integrationName: string): Metadata {
  return generateMetadata({
    title: `${integrationName} Integration - Settler`,
    description: `Connect ${integrationName} with Settler to normalize data and apply deterministic reconciliation rules across providers.`,
    keywords: [
      `${integrationName} reconciliation`,
      `${integrationName} integration`,
      `reconcile ${integrationName}`,
      `${integrationName} API`,
    ],
    canonical: `${getDefaultSiteUrl()}/integrations/${integrationName.toLowerCase()}`,
  });
}
