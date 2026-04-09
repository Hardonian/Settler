#!/usr/bin/env tsx
/**
 * Update Stripe Products to Match Pricing Model
 *
 * Updates Stripe products and prices to match config/pricing-simple.ts
 */

import Stripe from "stripe";
import { PRICING_PLANS } from "../config/pricing-simple";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY environment variable");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

async function updateStripeProducts() {
  console.log("💰 Updating Stripe Products to Match Pricing Model...\n");

  for (const [planId, plan] of Object.entries(PRICING_PLANS)) {
    if (planId === "enterprise") {
      console.log(`⏭️  Skipping ${plan.name} (custom pricing)\n`);
      continue;
    }

    console.log(`📦 Processing: ${plan.name} (${planId})`);
    console.log(`   Base: $${plan.basePriceMonthly}/month`);
    console.log(`   Included: ${plan.includedTransactions} transactions`);
    console.log(`   Overage: $${plan.pricePerTransaction} per transaction\n`);

    try {
      // Search for existing product
      const products = await stripe.products.search({
        query: `name:'${plan.name}' OR metadata['planId']:'${planId}'`,
      });

      let product: Stripe.Product;

      if (products.data.length > 0) {
        product = products.data[0];
        console.log(`   ✅ Found existing product: ${product.id}`);

        // Update product
        product = await stripe.products.update(product.id, {
          name: plan.name,
          description: plan.description,
          metadata: {
            planId: planId,
            basePriceMonthly: plan.basePriceMonthly.toString(),
            includedTransactions: plan.includedTransactions.toString(),
            pricePerTransaction: plan.pricePerTransaction.toString(),
          },
        });
        console.log(`   ✅ Updated product\n`);
      } else {
        // Create new product
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            planId: planId,
            basePriceMonthly: plan.basePriceMonthly.toString(),
            includedTransactions: plan.includedTransactions.toString(),
            pricePerTransaction: plan.pricePerTransaction.toString(),
          },
        });
        console.log(`   ✅ Created product: ${product.id}\n`);
      }

      // Create/update recurring price (base monthly fee)
      if (plan.basePriceMonthly > 0) {
        const prices = await stripe.prices.list({
          product: product.id,
          type: "recurring",
          active: true,
        });

        const basePrice = prices.data.find(
          (p) => p.recurring?.interval === "month" && p.unit_amount === plan.basePriceMonthly * 100
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
          console.log(`   ✅ Created base monthly price: $${plan.basePriceMonthly}/month\n`);
        } else {
          console.log(`   ✅ Base price exists: ${basePrice.id}\n`);
        }
      }

      // Create/update usage-based price (per transaction)
      const usagePrices = await stripe.prices.list({
        product: product.id,
        type: "recurring",
        active: true,
      });

      const transactionPrice = usagePrices.data.find(
        (p) =>
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
        console.log(`   ✅ Created usage price: $${plan.pricePerTransaction} per transaction\n`);
      } else {
        console.log(`   ✅ Usage price exists: ${transactionPrice.id}\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${plan.name}:`, error);
      if (error instanceof Stripe.errors.StripeError) {
        console.error(`      ${error.message}`);
      }
      console.log("");
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Stripe Products Updated");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("💡 Next steps:");
  console.log("   1. Review products in Stripe Dashboard");
  console.log("   2. Update checkout flow to use new prices");
  console.log("   3. Test subscription creation");
  console.log("");
}

updateStripeProducts().catch((error) => {
  console.error("❌ Failed to update Stripe products:", error);
  process.exit(1);
});
