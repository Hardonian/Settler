import { getImageUrl } from "@/lib/images/image-config";
import { generateProductSchema } from "@/lib/seo/structured-data";

interface StructuredDataProps {
  data: Record<string, any>;
  id?: string;
}

export function StructuredData({ data, id }: StructuredDataProps) {
  const safeJson = JSON.stringify(data, null, 0).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

  return (
    <script
      id={id || "structured-data"}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Settler.dev",
    url: "https://settler.dev",
    logo: getImageUrl("logoMain"),
    description:
      "Open-source reconciliation engine for deterministic, inspectable financial data matching.",
    sameAs: [
      "https://github.com/shardie-github/Settler-API",
      "https://twitter.com/settler_io",
      "https://discord.gg/settler",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@settler.dev",
      contactType: "Customer Support",
      availableLanguage: ["en"],
    },
    founder: {
      "@type": "Person",
      name: "Scott Hardie",
      email: "scottrmhardie@gmail.com",
      url: "https://linkedin.com/in/scottrmhardie",
    },
  };

  return <StructuredData data={schema} id="organization-schema" />;
}

export function SoftwareApplicationSchema() {
  // Use enhanced product schema from lib/seo/structured-data
  const schema = generateProductSchema();

  return <StructuredData data={schema} id="software-application-schema" />;
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={schema} id="faq-schema" />;
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Settler.dev",
    url: "https://settler.dev",
    description:
      "Open-source reconciliation engine for deterministic, inspectable financial data matching.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://settler.dev/support?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <StructuredData data={schema} id="website-schema" />;
}
