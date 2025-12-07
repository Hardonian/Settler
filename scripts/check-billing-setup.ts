/**
 * Check Billing Setup
 *
 * Quick check to verify billing system is properly configured.
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

async function checkSetup() {
  console.log("🔍 Checking billing system setup...\n");

  const checks = {
    supabase: false,
    stripe: false,
    database: false,
    addons: false,
    functions: false,
  };

  // Check Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error } = await supabase.from("billing_accounts").select("id").limit(1);
      if (!error || error.code !== "42P01") {
        checks.supabase = true;
        checks.database = true;
        console.log("✅ Supabase: Connected");
      } else {
        console.log("❌ Supabase: Tables not found (run migrations)");
      }
    } catch (error) {
      console.log("❌ Supabase: Connection failed");
    }
  } else {
    console.log("⚠️  Supabase: Credentials not set");
  }

  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
      await stripe.products.list({ limit: 1 });
      checks.stripe = true;
      console.log("✅ Stripe: Connected");
    } catch (error) {
      console.log("❌ Stripe: Connection failed");
    }
  } else {
    console.log("⚠️  Stripe: Not configured (required for billing)");
  }

  // Check Add-Ons
  if (checks.database) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data, error } = await supabase.from("add_ons").select("id").limit(1);
      if (!error && data && data.length > 0) {
        checks.addons = true;
        console.log("✅ Add-Ons: Seeded");
      } else {
        console.log("⚠️  Add-Ons: Not seeded (run: npm run billing:seed)");
      }
    } catch (error) {
      console.log("⚠️  Add-Ons: Could not verify");
    }
  }

  // Check Functions
  if (process.env.SUPABASE_URL) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/log-usage`, {
        method: "OPTIONS",
      });
      if (response.ok) {
        checks.functions = true;
        console.log("✅ Edge Functions: Deployed");
      } else {
        console.log("⚠️  Edge Functions: Not deployed or not accessible");
      }
    } catch (error) {
      console.log("⚠️  Edge Functions: Could not verify");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  const allGood = Object.values(checks).every(v => v);
  const criticalGood = checks.supabase && checks.database;

  if (allGood) {
    console.log("✅ All checks passed! Billing system is ready.");
  } else if (criticalGood) {
    console.log("⚠️  Core system ready, but some optional components need setup:");
    if (!checks.stripe) console.log("   - Configure Stripe for billing");
    if (!checks.addons) console.log("   - Seed add-ons: npm run billing:seed");
    if (!checks.functions) console.log("   - Deploy edge functions");
  } else {
    console.log("❌ Critical components missing. Please:");
    console.log("   1. Set Supabase credentials");
    console.log("   2. Run migrations: npm run db:push");
    console.log("   3. Seed add-ons: npm run billing:seed");
  }
}

if (require.main === module) {
  checkSetup();
}

export { checkSetup };
