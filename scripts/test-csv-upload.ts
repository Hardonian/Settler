/**
 * Test CSV Upload Script
 * Tests the CSV ingestion endpoint with sample data
 */

import { readFileSync } from "fs";
import { join } from "path";
import FormData from "form-data";
import fetch from "node-fetch";

const API_URL = process.env.API_URL || "http://localhost:3000";
const API_KEY = process.env.TEST_API_KEY || process.env.API_KEY || "";

async function testCSVUpload() {
  console.log("🧪 Testing CSV Upload...\n");

  if (!API_KEY) {
    console.error("❌ ERROR: API_KEY or TEST_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    // Read sample CSV file
    const csvPath = join(__dirname, "../examples/sample-transactions.csv");
    const csvContent = readFileSync(csvPath, "utf-8");

    console.log("📄 Sample CSV content:");
    console.log(csvContent.split("\n").slice(0, 3).join("\n") + "...\n");

    // Create form data
    const formData = new FormData();
    formData.append("file", csvContent, {
      filename: "sample-transactions.csv",
      contentType: "text/csv",
    });

    console.log("📤 Uploading CSV to:", `${API_URL}/api/v1/ingestion/upload`);

    // Upload CSV
    const response = await fetch(`${API_URL}/api/v1/ingestion/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Upload failed:");
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Error: ${errorText}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log("✅ Upload successful!\n");
    console.log("📊 Ingestion Result:");
    console.log(JSON.stringify(result, null, 2));

    // Wait a bit for processing
    console.log("\n⏳ Waiting for ingestion to complete...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check ingestion status
    const statusResponse = await fetch(
      `${API_URL}/api/v1/ingestion/${result.ingestionId}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log("\n📈 Ingestion Status:");
      console.log(`  Status: ${status.status}`);
      console.log(`  Total Rows: ${status.rawRecordCount}`);
      console.log(`  Normalized: ${status.normalizedCount}`);
      console.log(`  Failed: ${status.failedCount}`);
    }

    // Get transactions
    const transactionsResponse = await fetch(
      `${API_URL}/api/v1/ingestion/${result.ingestionId}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      console.log(`\n💳 Transactions (showing first 3):`);
      transactions.transactions.slice(0, 3).forEach((tx: any, i: number) => {
        console.log(`  ${i + 1}. ${tx.date} - $${tx.amount} ${tx.currency} - ${tx.description}`);
      });
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testCSVUpload().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
