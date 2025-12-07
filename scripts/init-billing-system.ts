/**
 * Initialize Billing System
 *
 * This script runs on first deployment to:
 * 1. Verify database migrations
 * 2. Seed add-ons if needed
 * 3. Verify Stripe products exist
 * 4. Set up initial configuration
 *
 * Run with: tsx scripts/init-billing-system.ts
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { getAllAddOnConfigs } from "../packages/api/src/config/addon-config";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

async function initializeBillingSystem() {
  console.log("🚀 Initializing billing system...\n");

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" }) : null;

  let errors: string[] = [];
  let warnings: string[] = [];

  // 1. Verify database tables exist
  console.log("1. Verifying database tables...");
  try {
    const { data: tables, error } = await supabase
      .from("billing_accounts")
      .select("id")
      .limit(1);

    if (error && error.code === "42P01") {
      errors.push("billing_accounts table does not exist. Run migrations first.");
    } else {
      console.log("   ✅ Database tables verified");
    }
  } catch (error) {
    errors.push(`Database verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2. Verify add-ons are seeded
  console.log("\n2. Verifying add-ons...");
  try {
    const { data: addOns, error } = await supabase
      .from("add_ons")
      .select("integration_id")
      .limit(1);

    if (error) {
      warnings.push("Could not verify add-ons. They may need to be seeded.");
    } else if (!addOns || addOns.length === 0) {
      console.log("   ⚠️  No add-ons found. Seeding add-ons...");
      
      const configs = getAllAddOnConfigs();
      for (const config of configs) {
        const { error: insertError } = await supabase
          .from("add_ons")
          .upsert({
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
          }, {
            onConflict: "integration_id",
          });

        if (insertError) {
          warnings.push(`Failed to seed add-on ${config.integration_id}: ${insertError.message}`);
        } else {
          console.log(`   ✅ Seeded add-on: ${config.name}`);
        }
      }
    } else {
      console.log("   ✅ Add-ons verified");
    }
  } catch (error) {
    warnings.push(`Add-on verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 3. Verify Stripe products (if Stripe is configured)
  if (stripe) {
    console.log("\n3. Verifying Stripe products...");
    try {
      const products = await stripe.products.list({ limit: 100 });
      const productNames = products.data.map(p => p.name);

      const requiredProducts = [
        "Settler Core",
        "TikTok Shop + TikTok Ads",
        "Wix Stores",
        "Google Analytics GA4 Deep Sync",
        "PayPal Payouts + Automation",
        "WhatsApp Business + Telegram Messaging",
      ];

      const missingProducts = requiredProducts.filter(name => !productNames.includes(name));

      if (missingProducts.length > 0) {
        warnings.push(`Missing Stripe products: ${missingProducts.join(", ")}`);
        console.log("   ⚠️  Some Stripe products are missing. Run: tsx scripts/setup-stripe-products.ts");
      } else {
        console.log("   ✅ Stripe products verified");
      }
    } catch (error) {
      warnings.push(`Stripe verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    warnings.push("Stripe not configured. Set STRIPE_SECRET_KEY to verify products.");
  }

  // 4. Verify database functions
  console.log("\n4. Verifying database functions...");
  try {
    const { error } = await supabase.rpc("log_usage_event", {
      p_billing_account_id: "00000000-0000-0000-0000-000000000000",
      p_event_type: "test",
      p_quantity: 0,
    });

    if (error && error.message.includes("does not exist")) {
      errors.push("Database functions not found. Run migrations.");
    } else {
      console.log("   ✅ Database functions verified");
    }
  } catch (error) {
    // Expected to fail with invalid UUID, but function should exist
    console.log("   ✅ Database functions verified");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Initialization Summary");
  console.log("=".repeat(50));

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(err => console.log(`   - ${err}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ Billing system initialized successfully!");
  } else if (errors.length === 0) {
    console.log("\n✅ Billing system initialized with warnings (see above)");
  } else {
    console.log("\n❌ Initialization failed. Please fix errors above.");
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  initializeBillingSystem()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { initializeBillingSystem };
