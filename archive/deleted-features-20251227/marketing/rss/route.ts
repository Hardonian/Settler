/**
 * RSS Feed Generator for Blog/Content Marketing
 * Generates RSS feed for SEO and content distribution
 */

import { NextResponse } from 'next/server';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';

interface BlogPost {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  author: string;
  category: string;
}

// TODO: Replace with actual blog posts from CMS or markdown files
const blogPosts: BlogPost[] = [
  {
    title: 'How We Built Settler: Reconciliation-as-a-Service',
    description: 'Learn how we built Settler from the ground up to solve financial reconciliation challenges.',
    slug: 'how-we-built-settler',
    publishedAt: '2026-01-15T00:00:00Z',
    author: 'Scott Hardie',
    category: 'Engineering',
  },
  {
    title: 'Reconciliation Best Practices for E-commerce',
    description: 'Best practices for reconciling transactions across multiple e-commerce platforms.',
    slug: 'reconciliation-best-practices',
    publishedAt: '2026-01-10T00:00:00Z',
    author: 'Settler Team',
    category: 'Best Practices',
  },
  {
    title: 'Stripe and Shopify Reconciliation Guide',
    description: 'Complete guide to reconciling Stripe payments with Shopify orders.',
    slug: 'stripe-shopify-reconciliation-guide',
    publishedAt: '2026-01-05T00:00:00Z',
    author: 'Settler Team',
    category: 'Tutorial',
  },
];

export async function GET() {
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Settler Blog - Financial Reconciliation Insights</title>
    <link>${baseUrl}</link>
    <description>Latest insights, tutorials, and best practices for financial reconciliation and API infrastructure.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/marketing/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/og-image.png</url>
      <title>Settler Blog</title>
      <link>${baseUrl}</link>
    </image>
    ${blogPosts
      .map(
        (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>${post.author}</author>
      <category>${post.category}</category>
    </item>`
      )
      .join('\n')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
