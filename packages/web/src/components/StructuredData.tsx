interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Settler',
    url: 'https://settler.dev',
    logo: 'https://settler.dev/icon-512x512.png',
    description: 'Reconciliation-as-a-Service API. Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems.',
    sameAs: [
      'https://github.com/shardie-github/Settler-API',
      'https://twitter.com/settler_io',
      'https://discord.gg/settler',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@settler.dev',
      contactType: 'Customer Support',
      availableLanguage: ['en'],
    },
    founder: {
      '@type': 'Person',
      name: 'Scott Hardie',
      email: 'scottrmhardie@gmail.com',
      url: 'https://linkedin.com/in/scottrmhardie',
    },
  };

  return <StructuredData data={schema} />;
}

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Settler API',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
    },
    description: 'Reconciliation-as-a-Service API for automating financial data reconciliation across platforms.',
    url: 'https://settler.dev',
    downloadUrl: 'https://www.npmjs.com/package/@settler/sdk',
  };

  return <StructuredData data={schema} />;
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={schema} />;
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Settler',
    url: 'https://settler.dev',
    description: 'Reconciliation-as-a-Service API. Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://settler.dev/support?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <StructuredData data={schema} />;
}
