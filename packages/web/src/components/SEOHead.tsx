import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = 'Settler - Reconciliation as a Service API',
  description = 'Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. One API. All Platforms. Real-Time.',
  canonical,
  ogImage = '/og-image.png',
  noindex = false,
}: SEOHeadProps) {
  const fullTitle = title.includes('Settler') ? title : `${title} | Settler`;
  const url = canonical || 'https://settler.dev';

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/icon-192x192.svg" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Settler',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '127',
            },
          }),
        }}
      />
    </Head>
  );
}
