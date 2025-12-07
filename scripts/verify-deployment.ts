/**
 * Verify Deployment
 *
 * Verifies that all billing system components are properly deployed.
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

async function verifyDeployment() {
  console.log("🔍 Verifying billing system deployment...\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  let allGood = true;

  // 1. Check Supabase connection
  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Supabase credentials not configured");
    allGood = false;
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from("billing_accounts").select("id").limit(1);
      if (error && error.code === "42P01") {
        console.log("❌ Database tables not found. Run migrations.");
        allGood = false;
      } else {
        console.log("✅ Supabase connection verified");
      }
    } catch (error) {
      console.log("❌ Supabase connection failed:", error instanceof Error ? error.message : String(error));
      allGood = false;
    }
  }

  // 2. Check Stripe connection
  if (!stripeKey) {
    console.log("⚠️  Stripe not configured (optional for initial setup)");
  } else {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      await stripe.products.list({ limit: 1 });
      console.log("✅ Stripe connection verified");
    } catch (error) {
      console.log("❌ Stripe connection failed:", error instanceof Error ? error.message : String(error));
      allGood = false;
    }
  }

  // 3. Check environment variables
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.log(`❌ Missing environment variables: ${missing.join(", ")}`);
    allGood = false;
  } else {
    console.log("✅ Required environment variables set");
  }

  if (allGood) {
    console.log("\n✅ Deployment verification passed!");
  } else {
    console.log("\n❌ Deployment verification failed. Please fix issues above.");
    process.exit(1);
  }
}

if (require.main === module) {
  verifyDeployment();
}

export { verifyDeployment };
