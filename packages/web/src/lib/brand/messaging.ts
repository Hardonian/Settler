/**
 * Brand Messaging
 *
 * Centralized brand messaging and copy for consistent tone across the console.
 */

export const BrandMessages = {
  // Error Messages
  errors: {
    unauthorized: "Please sign in to access this feature.",
    forbidden: "You don't have permission to perform this action.",
    notFound: "The requested resource was not found.",
    validation: "Please check your input and try again.",
    database: "We're experiencing database issues. Please try again in a moment.",
    network: "Network error. Please check your connection and try again.",
    rateLimit: "You've made too many requests. Please wait a moment and try again.",
    generic: "Something went wrong. Please try again or contact support if the problem persists.",
  },

  // Success Messages
  success: {
    created: "Successfully created.",
    updated: "Successfully updated.",
    deleted: "Successfully deleted.",
    saved: "Changes saved.",
  },

  // Empty States
  empty: {
    // Basic empty messages (for when data exists but user hasn't created any)
    apiKeys: "No API keys yet. Create your first API key to get started with the API.",
    receipts: "No receipts yet. Start parsing receipts using the Receipts API.",
    featureFlags: "No feature flags yet. Create your first flag to control feature rollouts.",
    webhooks: "No webhooks configured yet. Set up webhooks to receive real-time notifications.",
    insights: "No insights available yet. We'll generate insights as you use Settler.",
    alerts: "No active alerts. All systems operating normally.",
    usage: "No usage data available for this period.",

    // First-run / No data states - these explain WHY empty
    noData: {
      runs: {
        default: "No reconciliation runs yet. Start your first run to see results here.",
        noSetup: "Complete workspace setup before running reconciliations.",
        noSeed: 'No demo data loaded. Run "pnpm demo:seed" to populate sample data.',
      },
      apiKeys: {
        default: "No API keys yet. Create one to authenticate API requests.",
        noSetup: "Complete workspace setup to create API keys.",
        noSeed: "No demo API keys available.",
      },
      webhooks: {
        default: "No webhooks configured. Add a webhook to receive event notifications.",
        noSetup: "Complete workspace setup to configure webhooks.",
        noSeed: "No demo webhooks available.",
      },
      receipts: {
        default: "No receipts parsed yet. Submit receipts to see them here.",
        noSetup: "Complete workspace setup to start parsing receipts.",
        noSeed: 'No demo receipts available. Run "pnpm demo:seed" to load sample data.',
      },
    },

    // Setup required states - when user needs to complete setup first
    setupRequired: {
      runs: "Complete workspace setup and connect data sources before running reconciliations.",
      apiKeys: "Complete workspace setup to generate API keys.",
      webhooks: "Complete workspace setup to configure webhooks.",
      receipts: "Complete workspace setup to start parsing receipts.",
    },
  },

  // Loading States
  loading: {
    default: "Loading...",
    fetching: "Fetching data...",
    saving: "Saving...",
    processing: "Processing...",
  },

  // CTAs
  cta: {
    createApiKey: "Create API Key",
    viewDocs: "View Documentation",
    tryPlayground: "Try Playground",
    contactSupport: "Contact Support",
    upgrade: "Upgrade Plan",
    retry: "Try Again",
    learnMore: "Learn More",
  },

  // Descriptions
  descriptions: {
    console: "Manage your API keys, monitor usage, and explore your data.",
    apiKeys: "Generate and manage API keys for your applications.",
    usage: "Monitor your API usage across all Settler services.",
    performance: "Track API performance, latency, and throughput metrics.",
    insights: "Actionable recommendations powered by AI to optimize your usage.",
    webhooks: "Configure webhooks to receive real-time notifications about events.",
    receipts: "Browse and view receipts parsed by the Receipts API.",
    featureFlags: "Create and manage feature flags for your applications.",
  },
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("unauthorized") || message.includes("authentication")) {
      return BrandMessages.errors.unauthorized;
    }
    if (message.includes("forbidden") || message.includes("permission")) {
      return BrandMessages.errors.forbidden;
    }
    if (message.includes("not found")) {
      return BrandMessages.errors.notFound;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return BrandMessages.errors.validation;
    }
    if (
      message.includes("database") ||
      message.includes("prisma") ||
      message.includes("connection")
    ) {
      return BrandMessages.errors.database;
    }
    if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
      return BrandMessages.errors.network;
    }
    if (message.includes("rate limit") || message.includes("too many")) {
      return BrandMessages.errors.rateLimit;
    }
  }

  return BrandMessages.errors.generic;
}
