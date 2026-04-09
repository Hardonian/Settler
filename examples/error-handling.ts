/**
 * Example: Error Handling
 * Robust error handling with retries
 */

import Settler, { SettlerError } from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function createJobWithRetry(config: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await settler.jobs.create(config);
    } catch (error) {
      if (error instanceof SettlerError) {
        if (error.type === "RateLimitError" && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // Log error
        console.error("Settler error:", {
          type: error.type,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  try {
    const job = await createJobWithRetry({
      name: "Test Job",
      source: { adapter: "stripe", config: { apiKey: "sk_test_..." } },
      target: { adapter: "shopify", config: { apiKey: "shpat_...", shopDomain: "..." } },
      rules: { matching: [{ field: "order_id", type: "exact" }] },
    });

    console.log("Job created:", job.data.id);
  } catch (error) {
    if (error instanceof SettlerError) {
      // Handle Settler-specific errors
      switch (error.type) {
        case "ValidationError":
          console.error("Validation error:", error.details);
          break;
        case "RateLimitError":
          console.error("Rate limit exceeded, retry after:", error.retryAfter);
          break;
        default:
          console.error("Settler error:", error.message);
      }
    } else {
      // Handle unexpected errors
      console.error("Unexpected error:", error);
    }
  }
}

main().catch(console.error);
