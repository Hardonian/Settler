/**
 * Dynamic Sitemap Generation API Route
 * Generates sitemap with programmatic pages for SEO
 */

import { NextRequest, NextResponse } from "next/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';

export const GET = withUniversalBillingGate(async function GET(_request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev";
    
    // Static pages
    const staticPages = [
      "",
      "/pricing",
      "/docs",
      "/docs/getting-started",
      "/docs/api",
      "/docs/billing",
      "/support",
      "/enterprise",
      "/why-settler",
      "/architecture",
      "/security",
    ];

    // Programmatic pages - use cases
    const useCases = [
      "ecommerce-reconciliation",
      "payment-reconciliation",
      "receipt-processing",
      "multi-currency-reconciliation",
      "compliance-auditing",
    ];

    // Programmatic pages - integrations
    const integrations = [
      "stripe",
      "shopify",
      "paypal",
      "quickbooks",
      "xero",
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
${useCases
  .map(
    (useCase) => `  <url>
    <loc>${baseUrl}/use-cases/${useCase}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
${integrations
  .map(
    (integration) => `  <url>
    <loc>${baseUrl}/integrations/${integration}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (_error) {
    appLogger.error("Sitemap generation error", error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate sitemap',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' });
