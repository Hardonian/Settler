/**
 * Knowledge Base System
 * Builds knowledge base from FAQ, docs, and planning documents
 */

import fs from 'fs';
import path from 'path';

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'docs' | 'pricing' | 'features' | 'legal' | 'support' | 'oss';
  source: string;
  keywords: string[];
  metadata?: Record<string, any>;
}

/**
 * Load FAQ entries
 */
export async function loadFAQEntries(): Promise<KnowledgeBaseEntry[]> {
  // TODO: Load from actual FAQ files
  // For now, return structured FAQ data
  return [
    {
      id: 'faq-1',
      title: 'What problem does Settler solve?',
      content: 'Settler automates financial reconciliation across multiple e-commerce and payment platforms. Businesses waste 10+ hours per week manually matching transactions—Settler does this in minutes with 99.7% accuracy.',
      category: 'faq',
      source: 'investor-faq.md',
      keywords: ['problem', 'reconciliation', 'automation', 'accuracy'],
    },
    {
      id: 'faq-2',
      title: 'What is the difference between OSS SDK and SaaS?',
      content: 'OSS SDK is free, MIT-licensed, and can be self-hosted. Settler.dev SaaS provides cloud hosting, AI insights, managed infrastructure, and priority support. OSS includes core features but not AI insights or managed hosting.',
      category: 'faq',
      source: 'oss-comparison',
      keywords: ['oss', 'saas', 'difference', 'comparison', 'self-hosted'],
    },
    {
      id: 'faq-3',
      title: 'How do I install the SDK?',
      content: 'Install via npm: npm install @settler/sdk, yarn: yarn add @settler/sdk, or pnpm: pnpm add @settler/sdk. See /docs/quickstart for detailed instructions.',
      category: 'docs',
      source: 'installation',
      keywords: ['install', 'sdk', 'npm', 'yarn', 'pnpm'],
    },
    {
      id: 'faq-4',
      title: 'What are the pricing plans?',
      content: 'Free: $0/month (1,000 reconciliations), Commercial: $99/month (10,000 reconciliations), Pro: $499/month (100,000 reconciliations), Enterprise: Custom pricing. All plans include 14-day free trial, no credit card required.',
      category: 'pricing',
      source: 'pricing-page',
      keywords: ['pricing', 'plans', 'free', 'commercial', 'enterprise'],
    },
    {
      id: 'faq-5',
      title: 'What platforms does Settler integrate with?',
      content: 'Settler integrates with Stripe, Shopify, PayPal, QuickBooks, Xero, Square, WooCommerce, BigCommerce, Magento, Salesforce, and 50+ other platforms. See /docs/integrations for the full list.',
      category: 'features',
      source: 'integrations',
      keywords: ['integrations', 'platforms', 'stripe', 'shopify', 'paypal'],
    },
    {
      id: 'faq-6',
      title: 'Is Settler secure and compliant?',
      content: 'Yes. Settler is ISO 27001 and SOC 2 compliant. We use encryption at rest and in transit, follow security best practices, and offer DPA for enterprise customers. See /security for details.',
      category: 'legal',
      source: 'security-page',
      keywords: ['security', 'compliance', 'iso', 'soc2', 'encryption'],
    },
    {
      id: 'faq-7',
      title: 'How do I use the playground?',
      content: 'Visit /console/playground to try Settler without signing up. You can test reconciliation, receipt parsing, feature flags, currency conversion, and CLI commands. No account required.',
      category: 'support',
      source: 'playground',
      keywords: ['playground', 'try', 'test', 'demo'],
    },
    {
      id: 'faq-8',
      title: 'What is the OSS license?',
      content: 'Settler SDK is licensed under MIT License. You can use, modify, and distribute it freely. See /legal/license for full license text.',
      category: 'oss',
      source: 'license',
      keywords: ['license', 'mit', 'oss', 'open source'],
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
    .filter((item) => item.score > 0)
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
    return 'No relevant information found in knowledge base.';
  }
  
  return relevant
    .map(
      (entry) => `Title: ${entry.title}\nContent: ${entry.content}\nCategory: ${entry.category}`
    )
    .join('\n\n---\n\n');
}
