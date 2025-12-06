/**
 * Stripe Products & Prices Setup Script
 *
 * Creates Stripe products and prices for:
 * - Base plan ($49.95/month)
 * - 5 Premium add-ons with monthly + usage pricing
 *
 * Run with: tsx scripts/setup-stripe-products.ts
 */

import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

interface ProductConfig {
  name: string;
  description: string;
  integrationId: string;
  basePriceMonthly: number;
  usagePricePerUnit?: number;
  usageUnit?: string;
}

const PRODUCTS: ProductConfig[] = [
  {
    name: "Settler Core",
    description: "Base reconciliation plan with 5 standard integrations",
    integrationId: "base",
    basePriceMonthly: 49.95,
  },
  {
    name: "TikTok Shop + TikTok Ads",
    description: "TikTok Shop order reconciliation and TikTok Ads spend tracking",
    integrationId: "tiktok-shop",
    basePriceMonthly: 39.95,
    usagePricePerUnit: 0.02,
    usageUnit: "order",
  },
  {
    name: "Wix Stores",
    description: "Wix Stores order reconciliation",
    integrationId: "wix-stores",
    basePriceMonthly: 19.95,
    usagePricePerUnit: 0.01,
    usageUnit: "order",
  },
  {
    name: "Google Analytics GA4 Deep Sync",
    description: "GA4 event data reconciliation with revenue",
    integrationId: "ga4-deep-sync",
    basePriceMonthly: 29.95,
    usagePricePerUnit: 0.005,
    usageUnit: "event",
  },
  {
    name: "PayPal Payouts + Automation",
    description: "PayPal Payouts API reconciliation and automation",
    integrationId: "paypal-payouts",
    basePriceMonthly: 49.95,
    usagePricePerUnit: 0.03,
    usageUnit: "payout",
  },
  {
    name: "WhatsApp Business + Telegram Messaging",
    description: "WhatsApp Business API and Telegram Bot API integration",
    integrationId: "whatsapp-telegram",
    basePriceMonthly: 79.95,
    usagePricePerUnit: 0.001,
    usageUnit: "message",
  },
];

async function createStripeProducts() {
  console.log("🚀 Starting Stripe products and prices setup...\n");

  const results: Array<{
    integrationId: string;
    productId?: string;
    priceId?: string;
    error?: string;
  }> = [];

  for (const productConfig of PRODUCTS) {
    try {
      console.log(`Creating product: ${productConfig.name}...`);

      // Create product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          integration_id: productConfig.integrationId,
          base_price_monthly: productConfig.basePriceMonthly.toString(),
        },
      });

      console.log(`  ✅ Product created: ${product.id}`);

      // Create monthly recurring price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(productConfig.basePriceMonthly * 100), // Convert to cents
        currency: "usd",
        recurring: {
          interval: "month",
        },
        metadata: {
          integration_id: productConfig.integrationId,
          price_type: "monthly",
        },
      });

      console.log(`  ✅ Monthly price created: ${monthlyPrice.id}`);

      // Create usage-based price if applicable
      let usagePriceId: string | undefined;

      if (productConfig.usagePricePerUnit && productConfig.usageUnit) {
        const usagePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(productConfig.usagePricePerUnit * 1000000), // Convert to smallest currency unit (microdollars)
          currency: "usd",
          recurring: {
            interval: "month",
            usage_type: "metered",
          },
          billing_scheme: "per_unit",
          metadata: {
            integration_id: productConfig.integrationId,
            price_type: "usage",
            usage_unit: productConfig.usageUnit,
          },
        });

        usagePriceId = usagePrice.id;
        console.log(`  ✅ Usage price created: ${usagePrice.id} (${productConfig.usagePricePerUnit} per ${productConfig.usageUnit})`);
      }

      results.push({
        integrationId: productConfig.integrationId,
        productId: product.id,
        priceId: monthlyPrice.id,
      });

      console.log(`  ✅ Completed: ${productConfig.name}\n`);
    } catch (error) {
      console.error(`  ❌ Error creating ${productConfig.name}:`, error);
      results.push({
        integrationId: productConfig.integrationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Print summary
  console.log("\n📊 Setup Summary:");
  console.log("================\n");

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.integrationId}: ${result.error}`);
    } else {
      console.log(`✅ ${result.integrationId}:`);
      console.log(`   Product ID: ${result.productId}`);
      console.log(`   Price ID: ${result.priceId}`);
    }
  }

  // Print environment variables to add
  console.log("\n📝 Add these to your .env file:\n");
  console.log("# Stripe Product IDs");
  for (const result of results) {
    if (result.productId && result.priceId) {
      const envVar = result.integrationId.toUpperCase().replace(/-/g, "_");
      console.log(`STRIPE_PRODUCT_${envVar}=${result.productId}`);
      console.log(`STRIPE_PRICE_${envVar}=${result.priceId}`);
    }
  }

  console.log("\n✅ Setup complete!");
}

// Run if executed directly
if (require.main === module) {
  createStripeProducts()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { createStripeProducts };
