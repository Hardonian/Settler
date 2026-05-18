#!/usr/bin/env tsx
/**
 * Update Stripe Products to Match Pricing Model
 *
 * Updates Stripe products and prices to match config/pricing-simple.ts
 */

import Stripe from "stripe";
import { PRICING_PLANS, type PricingPlan } from "../config/pricing-simple";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY environment variable");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

async function upsertProduct(planId: string, plan: PricingPlan) {
  const products = await stripe.products.search({
    query: `name:'${plan.name}' OR metadata['planId']:'${planId}'`,
  });

  const metadata = {
    planId: planId,
    basePriceMonthly: plan.basePriceMonthly.toString(),
    includedTransactions: plan.includedTransactions.toString(),
    pricePerTransaction: plan.pricePerTransaction.toString(),
  };

  if (products.data.length > 0) {
    const product = products.data[0];
    console.info(`   ✅ Found existing product: ${product.id}`);

    const updatedProduct = await stripe.products.update(product.id, {
      name: plan.name,
      description: plan.description,
      metadata,
    });
    console.info(`   ✅ Updated product\n`);
    return updatedProduct;
  }

  const newProduct = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata,
  });
  console.info(`   ✅ Created product: ${newProduct.id}\n`);
  return newProduct;
}

async function upsertBasePrice(product: Stripe.Product, planId: string, plan: PricingPlan) {
  if (plan.basePriceMonthly <= 0) return;

  const prices = await stripe.prices.list({
    product: product.id,
    type: "recurring",
    active: true,
  });

  const basePrice = prices.data.find(
    (p: Stripe.Price) =>
      p.recurring?.interval === "month" && p.unit_amount === plan.basePriceMonthly * 100
  );

  if (!basePrice) {
    await stripe.prices.create({
      product: product.id,
      unit_amount: plan.basePriceMonthly * 100,
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        type: "base",
        planId: planId,
      },
    });
    console.info(`   ✅ Created base monthly price: $${plan.basePriceMonthly}/month\n`);
  } else {
    console.info(`   ✅ Base price exists: ${basePrice.id}\n`);
  }
}

async function upsertUsagePrice(product: Stripe.Product, planId: string, plan: PricingPlan) {
  const usagePrices = await stripe.prices.list({
    product: product.id,
    type: "recurring",
    active: true,
  });

  const transactionPrice = usagePrices.data.find(
    (p: Stripe.Price) =>
      p.recurring?.usage_type === "metered" &&
      p.metadata?.type === "usage" &&
      p.metadata?.unit === "transaction"
  );

  if (!transactionPrice) {
    await stripe.prices.create({
      product: product.id,
      unit_amount: plan.pricePerTransaction * 100, // Convert to cents
      currency: "usd",
      recurring: {
        interval: "month",
        usage_type: "metered",
      },
      billing_scheme: "per_unit",
      metadata: {
        type: "usage",
        planId: planId,
        unit: "transaction",
        includedTransactions: plan.includedTransactions.toString(),
      },
    });
    console.info(`   ✅ Created usage price: $${plan.pricePerTransaction} per transaction\n`);
  } else {
    console.info(`   ✅ Usage price exists: ${transactionPrice.id}\n`);
  }
}

async function updateStripeProducts() {
  console.info("💰 Updating Stripe Products to Match Pricing Model...\n");

  for (const [planId, plan] of Object.entries(PRICING_PLANS)) {
    if (planId === "enterprise") {
      console.info(`⏭️  Skipping ${plan.name} (custom pricing)\n`);
      continue;
    }

    console.info(`📦 Processing: ${plan.name} (${planId})`);
    console.info(`   Base: $${plan.basePriceMonthly}/month`);
    console.info(`   Included: ${plan.includedTransactions} transactions`);
    console.info(`   Overage: $${plan.pricePerTransaction} per transaction\n`);

    try {
      const product = await upsertProduct(planId, plan);
      await upsertBasePrice(product, planId, plan);
      await upsertUsagePrice(product, planId, plan);
    } catch (error) {
      console.error(`   ❌ Error processing ${plan.name}:`, error);
      if (error instanceof Error && "type" in error && error.constructor.name === "StripeError") {
        console.error(`      ${error.message}`);
      } else if (error instanceof Error) {
        console.error(`      ${error.message}`);
      }
      console.info("");
    }
  }

  console.info("═══════════════════════════════════════════════════════════");
  console.info("✅ Stripe Products Updated");
  console.info("═══════════════════════════════════════════════════════════\n");
  console.info("💡 Next steps:");
  console.info("   1. Review products in Stripe Dashboard");
  console.info("   2. Update checkout flow to use new prices");
  console.info("   3. Test subscription creation");
  console.info("");
}

updateStripeProducts().catch((error) => {
  console.error("❌ Failed to update Stripe products:", error);
  process.exit(1);
});
