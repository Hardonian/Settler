import { SettlerClient } from "@settler/sdk";

/**
 * This example demonstrates the core features of the Settler Node SDK
 */
async function runDemo() {
  // Initialize the client
  const client = new SettlerClient({
    apiKey: process.env.SETTLER_API_KEY || "demo_key",
    // Optional: connect to local or staging environment
    baseUrl: process.env.SETTLER_API_URL,
  });

  console.log("🚀 Starting Settler SDK Demo...");

  try {
    // 1. RECONCILIATION
    // Create a reconciliation job between two data sources
    console.log("\n1. Reconciliation -----------------------------------");
    const job = await client.jobs.create({
      name: "E-commerce Recon Demo",
      source: {
        adapter: "shopify",
        config: { apiKey: "demo_shopify" },
      },
      target: {
        adapter: "stripe",
        config: { apiKey: "demo_stripe" },
      },
      rules: {
        matching: [
          { field: "order_id", type: "exact" },
          { field: "amount", type: "exact", tolerance: 0.05 }, // 5 cent tolerance
          { field: "date", type: "range", days: 2 }, // 2 day window
        ],
        conflictResolution: "manual-review",
      },
    });
    console.log(`✅ Created Job: ${job.id}`);

    // 2. RECEIPTS
    // Parse a receipt from a URL
    console.log("\n2. Receipts Parsing --------------------------------");
    const receiptUrl =
      "https://raw.githubusercontent.com/settler/examples/main/receipts/starbucks.jpg";
    // In a real app, you might upload a file buffer instead
    const receipt = await client.receipts.parse(receiptUrl);
    console.log(`✅ Parsed Receipt: ${receipt.merchant.name}`);
    console.log(`   Total: ${receipt.currency} ${receipt.total}`);
    console.log(`   Items: ${receipt.items.length}`);

    // 3. FEATURE FLAGS
    // Evaluate a feature flag for a user context
    console.log("\n3. Feature Flags -----------------------------------");
    const context = {
      userId: "user_123",
      email: "jane@example.com",
      plan: "enterprise",
    };
    const flag = await client.flags.evaluate("new-dashboard", context, false);
    console.log(`✅ Flag 'new-dashboard': ${flag.value}`);
    console.log(`   Variant: ${flag.variant}`);

    // 4. CONVERSION
    // Convert currency and units
    console.log("\n4. Conversion --------------------------------------");

    // Currency
    const currency = await client.convert.currency(100, "USD", "EUR");
    console.log(`✅ Currency: 100 USD = ${currency.amount} EUR (Rate: ${currency.rate})`);

    // Unit
    const unit = await client.convert.unit(10, "kg", "lb");
    console.log(`✅ Unit: 10 kg = ${unit.value} lb`);

    // Financial Formatting
    const fmt = await client.convert.financial(1234567.89, "number", "human-readable");
    console.log(`✅ Formatted: ${fmt}`); // e.g. "$1.23M"
  } catch (error) {
    console.error("❌ Error running demo:", error);
  }
}

// Execute the demo if run directly
if (require.main === module) {
  runDemo();
}

export default runDemo;
