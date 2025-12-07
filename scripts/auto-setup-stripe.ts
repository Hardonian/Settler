/**
 * Auto-Setup Stripe Products
 *
 * Automatically creates Stripe products and prices on first run.
 * Updates environment variables if running in CI/CD.
 */

import Stripe from "stripe";
import { createStripeProducts } from "./setup-stripe-products";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.log("⚠️  STRIPE_SECRET_KEY not set. Skipping Stripe product setup.");
  console.log("   Products will need to be created manually or via setup-stripe-products.ts");
  process.exit(0);
}

async function autoSetup() {
  try {
    console.log("🔧 Auto-setting up Stripe products...\n");
    await createStripeProducts();
    
    // In CI/CD, you might want to output the IDs for environment variables
    if (process.env.CI) {
      console.log("\n📝 Add the product/price IDs above to your GitHub Secrets or environment variables.");
    }
  } catch (error) {
    console.error("❌ Failed to setup Stripe products:", error);
    // Don't fail the build if Stripe setup fails
    process.exit(0);
  }
}

if (require.main === module) {
  autoSetup();
}
