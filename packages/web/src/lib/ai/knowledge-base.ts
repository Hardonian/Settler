/**
 * Knowledge Base System
 * Builds knowledge base from FAQ, docs, and planning documents
 */

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: "faq" | "docs" | "pricing" | "features" | "legal" | "support" | "oss";
  source: string;
  keywords: string[];
  metadata?: Record<string, any>;
}

/**
 * Load FAQ entries
 */
export async function loadFAQEntries(): Promise<KnowledgeBaseEntry[]> {
  // Load FAQ from markdown/JSON files or API
  // For now, return structured FAQ data
  return [
    {
      id: "faq-1",
      title: "What problem does Settler solve?",
      content:
        "Settler provides deterministic reconciliation workflows across multiple payment and ledger sources. It focuses on explicit rules, replayable evidence, and operator review instead of opaque automation.",
      category: "faq",
      source: "investor-faq.md",
      keywords: ["problem", "reconciliation", "automation", "accuracy"],
    },
    {
      id: "faq-2",
      title: "What is the difference between OSS SDK and SaaS?",
      content:
        "OSS SDK is free, MIT-licensed, and can be self-hosted. Settler.dev SaaS provides cloud hosting, AI insights, managed infrastructure, and priority support. OSS includes core features but not AI insights or managed hosting.",
      category: "faq",
      source: "oss-comparison",
      keywords: ["oss", "saas", "difference", "comparison", "self-hosted"],
    },
    {
      id: "faq-3",
      title: "How do I install the SDK?",
      content:
        "Install via npm: npm install @settler/sdk, yarn: yarn add @settler/sdk, or pnpm: pnpm add @settler/sdk. See /docs/quickstart for detailed instructions.",
      category: "docs",
      source: "installation",
      keywords: ["install", "sdk", "npm", "yarn", "pnpm"],
    },
    {
      id: "faq-4",
      title: "What are the pricing plans?",
      content:
        "Settler offers self-serve and enterprise engagement paths. Packaging and limits can change over time; use /pricing for the current plan matrix and contact path.",
      category: "pricing",
      source: "pricing-page",
      keywords: ["pricing", "plans", "free", "commercial", "enterprise"],
    },
    {
      id: "faq-5",
      title: "What platforms does Settler integrate with?",
      content:
        "Settler ships adapter-driven integrations for common payment and accounting systems. Coverage evolves; refer to /docs/integrations for the current supported set.",
      category: "features",
      source: "integrations",
      keywords: ["integrations", "platforms", "stripe", "shopify", "paypal"],
    },
    {
      id: "faq-6",
      title: "Is Settler secure and compliant?",
      content:
        "Settler publishes its security model, evidence verification approach, and non-guarantees at /security-and-audit. If you require specific certifications or contractual controls, validate current status directly with the team before relying on them.",
      category: "legal",
      source: "security-page",
      keywords: ["security", "compliance", "iso", "soc2", "encryption"],
    },
    {
      id: "faq-7",
      title: "How do I use the playground?",
      content:
        "Visit /console/playground to try Settler without signing up. You can test reconciliation, receipt parsing, feature flags, currency conversion, and CLI commands. No account required.",
      category: "support",
      source: "playground",
      keywords: ["playground", "try", "test", "demo"],
    },
    {
      id: "faq-8",
      title: "What is the OSS license?",
      content:
        "Settler SDK is licensed under MIT License. You can use, modify, and distribute it freely. See /legal/license for full license text.",
      category: "oss",
      source: "license",
      keywords: ["license", "mit", "oss", "open source"],
    },
  ];
}

/**
 * Search knowledge base
 */
export function searchKnowledgeBase(
  query: string,
  entries: KnowledgeBaseEntry[],
  limit: number = 5
): KnowledgeBaseEntry[] {
  const lowerQuery = query.toLowerCase();

  // Score entries based on relevance
  const scored = entries.map((entry) => {
    let score = 0;

    // Title match (highest weight)
    if (entry.title.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    // Content match
    if (entry.content.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    // Keyword match
    entry.keywords.forEach((keyword) => {
      if (keyword.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }
    });

    // Category match
    if (entry.category.toLowerCase().includes(lowerQuery)) {
      score += 2;
    }

    return { entry, score };
  });

  // Sort by score and return top results
  return scored
    .filter((item: any) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

/**
 * Get context for AI from knowledge base
 */
export function getKnowledgeBaseContext(
  query: string,
  entries: KnowledgeBaseEntry[],
  maxEntries: number = 3
): string {
  const relevant = searchKnowledgeBase(query, entries, maxEntries);

  if (relevant.length === 0) {
    return "No relevant information found in knowledge base.";
  }

  return relevant
    .map((entry) => `Title: ${entry.title}\nContent: ${entry.content}\nCategory: ${entry.category}`)
    .join("\n\n---\n\n");
}
