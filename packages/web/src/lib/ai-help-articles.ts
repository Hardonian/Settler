/**
 * AI-Generated Help Center Articles
 * Generates help articles based on common questions and issues
 */

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  relatedArticles: string[];
}

type ArticleParams = 
  | { integration: string }
  | { error: string }
  | { feature: string }
  | Record<string, string | number>;

const ARTICLE_TEMPLATES: Record<string, (params: ArticleParams) => HelpArticle> = {
  "integration-setup": (params) => {
    if (!('integration' in params) || typeof params.integration !== 'string') {
      throw new Error('integration-setup template requires integration parameter');
    }
    return {
    id: `setup-${params.integration}`,
    title: `How to Set Up ${params.integration} Integration`,
    category: "Integrations",
    content: `# Setting Up ${params.integration} Integration

## Overview
This guide will walk you through connecting your ${params.integration} account to Settler.

## Prerequisites
- Active ${params.integration} account
- API credentials from ${params.integration}

## Steps

### 1. Get Your API Credentials
1. Log in to your ${params.integration} dashboard
2. Navigate to API settings
3. Generate a new API key
4. Copy the key (you won't be able to see it again)

### 2. Connect in Settler
1. Go to Integrations in your Settler dashboard
2. Click "Connect" on ${params.integration}
3. Paste your API key
4. Click "Test Connection"
5. Save the integration

### 3. Verify Connection
- Check the integration status shows "Connected"
- Run a test sync to verify data is flowing

## Troubleshooting
- **Invalid API Key**: Verify you copied the key correctly
- **Permission Errors**: Ensure your API key has read permissions
- **Connection Timeout**: Check your network connection

## Need Help?
Contact support if you encounter any issues.`,
    keywords: [`${params.integration}`, "setup", "integration", "API key"],
    relatedArticles: ["general-integration-guide", "troubleshooting-integrations"],
    };
  },

  "reconciliation-job": () => ({
    id: "create-reconciliation-job",
    title: "How to Create a Reconciliation Job",
    category: "Jobs",
    content: `# Creating Your First Reconciliation Job

## Overview
A reconciliation job matches transactions between two platforms.

## Steps

### 1. Choose Source and Target
- Source: Where transactions originate (e.g., Shopify)
- Target: Where they should match (e.g., Stripe)

### 2. Configure Matching Rules
- Field matching: Which fields to match on (order_id, amount, etc.)
- Tolerance: Allowable difference in amounts
- Date range: Which transactions to reconcile

### 3. Run the Job
- Click "Run" to start reconciliation
- Monitor progress in real-time
- Review results and unmatched items

## Best Practices
- Start with a small date range for testing
- Use exact matching for IDs when possible
- Set appropriate tolerance for amounts

## Next Steps
- Review unmatched items
- Adjust matching rules if needed
- Schedule recurring jobs`,
    keywords: ["reconciliation", "job", "matching", "setup"],
    relatedArticles: ["matching-rules", "understanding-results"],
  }),
};

/**
 * Generate help article
 */
export function generateHelpArticle(template: string, params: ArticleParams): HelpArticle {
  const generator = ARTICLE_TEMPLATES[template];
  if (!generator) {
    throw new Error(`Unknown article template: ${template}`);
  }
  return generator(params);
}

/**
 * Generate article from user question
 */
export function generateArticleFromQuestion(question: string): HelpArticle {
  // In production, use AI to generate article
  // For now, return template-based article

  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("setup") || lowerQuestion.includes("connect")) {
    if (lowerQuestion.includes("stripe")) {
      return generateHelpArticle("integration-setup", { integration: "Stripe" });
    }
    if (lowerQuestion.includes("shopify")) {
      return generateHelpArticle("integration-setup", { integration: "Shopify" });
    }
    return generateHelpArticle("integration-setup", { integration: "Integration" });
  }

  if (lowerQuestion.includes("job") || lowerQuestion.includes("reconciliation")) {
    return generateHelpArticle("reconciliation-job", {});
  }

  // Default article
  return {
    id: `article-${Date.now()}`,
    title: "Getting Started with Settler",
    category: "Getting Started",
    content: `# Getting Started with Settler

## Welcome
Settler helps you automate financial reconciliation across platforms.

## Quick Start
1. Sign up for a free account
2. Connect your first integration
3. Create a reconciliation job
4. Review results

## Need Help?
Check our documentation or contact support.`,
    keywords: ["getting started", "basics"],
    relatedArticles: [],
  };
}
