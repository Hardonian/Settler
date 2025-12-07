/**
 * Add-On Configuration System
 *
 * Allows new add-ons to be defined via JSON configuration
 * without requiring database schema changes.
 */

export interface AddOnConfig {
  integration_id: string;
  name: string;
  description: string;
  category: "integration" | "feature" | "support";
  base_price_monthly: number;
  usage_price_per_unit?: number;
  usage_unit?: string;
  is_standard: boolean;
  features?: string[];
  required_credentials?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Add-on configurations (can be loaded from JSON file or database)
 */
export const ADDON_CONFIGS: Record<string, AddOnConfig> = {
  stripe: {
    integration_id: "stripe",
    name: "Stripe",
    description: "Payment processor reconciliation",
    category: "integration",
    base_price_monthly: 0,
    is_standard: true,
    required_credentials: ["apiKey"],
  },
  shopify: {
    integration_id: "shopify",
    name: "Shopify",
    description: "E-commerce order & payment sync",
    category: "integration",
    base_price_monthly: 0,
    is_standard: true,
    required_credentials: ["storeUrl", "apiKey", "apiSecret"],
  },
  paypal: {
    integration_id: "paypal",
    name: "PayPal",
    description: "Standard payment reconciliation",
    category: "integration",
    base_price_monthly: 0,
    is_standard: true,
    required_credentials: ["clientId", "clientSecret"],
  },
  "google-pay": {
    integration_id: "google-pay",
    name: "Google Pay",
    description: "Payment method reconciliation",
    category: "integration",
    base_price_monthly: 0,
    is_standard: true,
    required_credentials: ["apiKey", "merchantId"],
  },
  "meta-commerce": {
    integration_id: "meta-commerce",
    name: "Meta Commerce + Meta Ads",
    description: "Facebook/Instagram shop & ad spend reconciliation",
    category: "integration",
    base_price_monthly: 0,
    is_standard: true,
    required_credentials: ["accessToken", "businessId"],
  },
  "tiktok-shop": {
    integration_id: "tiktok-shop",
    name: "TikTok Shop + TikTok Ads",
    description: "TikTok Shop order reconciliation and TikTok Ads spend tracking",
    category: "integration",
    base_price_monthly: 39.95,
    usage_price_per_unit: 0.02,
    usage_unit: "order",
    is_standard: false,
    features: [
      "TikTok Shop order reconciliation",
      "TikTok Ads spend tracking",
      "Real-time inventory sync",
      "Campaign performance reconciliation",
    ],
    required_credentials: ["accessToken", "appKey", "appSecret", "advertiserId"],
  },
  "wix-stores": {
    integration_id: "wix-stores",
    name: "Wix Stores",
    description: "Wix Stores order reconciliation",
    category: "integration",
    base_price_monthly: 19.95,
    usage_price_per_unit: 0.01,
    usage_unit: "order",
    is_standard: false,
    features: [
      "Wix Stores order reconciliation",
      "Payment processor sync",
      "Product catalog reconciliation",
    ],
    required_credentials: ["apiKey", "siteId"],
  },
  "ga4-deep-sync": {
    integration_id: "ga4-deep-sync",
    name: "Google Analytics GA4 Deep Sync",
    description: "GA4 event data reconciliation with revenue",
    category: "integration",
    base_price_monthly: 29.95,
    usage_price_per_unit: 0.005,
    usage_unit: "event",
    is_standard: false,
    features: [
      "GA4 event data reconciliation",
      "E-commerce transaction matching",
      "Attribution modeling",
    ],
    required_credentials: ["propertyId", "credentials"],
  },
  "paypal-payouts": {
    integration_id: "paypal-payouts",
    name: "PayPal Payouts + Automation",
    description: "PayPal Payouts API reconciliation and automation",
    category: "integration",
    base_price_monthly: 49.95,
    usage_price_per_unit: 0.03,
    usage_unit: "payout",
    is_standard: false,
    features: [
      "PayPal Payouts API reconciliation",
      "Automated payout scheduling",
      "Multi-recipient payout reconciliation",
    ],
    required_credentials: ["clientId", "clientSecret"],
  },
  "whatsapp-telegram": {
    integration_id: "whatsapp-telegram",
    name: "WhatsApp Business + Telegram Messaging",
    description: "WhatsApp Business API and Telegram Bot API integration",
    category: "integration",
    base_price_monthly: 79.95,
    usage_price_per_unit: 0.001,
    usage_unit: "message",
    is_standard: false,
    features: [
      "WhatsApp Business API integration",
      "Telegram Bot API integration",
      "Payment link reconciliation",
    ],
    required_credentials: ["whatsappToken", "telegramBotToken"],
  },
};

/**
 * Load add-on configuration
 */
export function getAddOnConfig(integrationId: string): AddOnConfig | null {
  return ADDON_CONFIGS[integrationId] || null;
}

/**
 * Get all add-on configurations
 */
export function getAllAddOnConfigs(): AddOnConfig[] {
  return Object.values(ADDON_CONFIGS);
}

/**
 * Get standard add-ons
 */
export function getStandardAddOns(): AddOnConfig[] {
  return Object.values(ADDON_CONFIGS).filter((config) => config.is_standard);
}

/**
 * Get premium add-ons
 */
export function getPremiumAddOns(): AddOnConfig[] {
  return Object.values(ADDON_CONFIGS).filter((config) => !config.is_standard);
}

/**
 * Validate add-on configuration
 */
export function validateAddOnConfig(config: AddOnConfig): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!config.integration_id) {
    errors.push("integration_id is required");
  }
  if (!config.name) {
    errors.push("name is required");
  }
  if (config.base_price_monthly < 0) {
    errors.push("base_price_monthly must be >= 0");
  }
  if (config.usage_price_per_unit !== undefined && config.usage_price_per_unit < 0) {
    errors.push("usage_price_per_unit must be >= 0");
  }
  if (config.usage_price_per_unit && !config.usage_unit) {
    errors.push("usage_unit is required when usage_price_per_unit is set");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Create add-on from configuration (for seeding database)
 */
export async function createAddOnFromConfig(
  config: AddOnConfig,
  supabase: any
): Promise<string | null> {
  const validation = validateAddOnConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid add-on config: ${validation.errors?.join(", ")}`);
  }

  const { data, error } = await supabase
    .from("add_ons")
    .insert({
      integration_id: config.integration_id,
      name: config.name,
      description: config.description,
      category: config.category,
      base_price_monthly: config.base_price_monthly,
      usage_price_per_unit: config.usage_price_per_unit || null,
      usage_unit: config.usage_unit || null,
      is_standard: config.is_standard,
      is_active: true,
      metadata: config.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating add-on:", error);
    return null;
  }

  return data.id;
}
