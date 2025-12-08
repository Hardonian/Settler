/**
 * Example: Exception Handling
 * Review and resolve unmatched transactions
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  const jobId = "job_abc123";

  // Get exceptions (unmatched transactions)
  const exceptions = await settler.exceptions.list({
    jobId,
    resolution_status: "open",
    limit: 50,
  });

  console.log(`Found ${exceptions.data.length} open exceptions`);

  // Review each exception
  for (const exception of exceptions.data) {
    console.log(`Exception ${exception.id}:`);
    console.log(`  Category: ${exception.category}`);
    console.log(`  Description: ${exception.description}`);
    console.log(`  Severity: ${exception.severity}`);

    // Resolve exception
    if (exception.severity === "low") {
      await settler.exceptions.resolve(exception.id, {
        resolution: "ignored",
        notes: "Low-value transaction, acceptable variance",
      });
      console.log(`  Resolved as ignored`);
    } else {
      // Manual review needed
      console.log(`  Requires manual review`);
    }
  }

  // Bulk resolve low-severity exceptions
  const lowSeverityExceptions = exceptions.data.filter(
    e => e.severity === "low"
  );

  if (lowSeverityExceptions.length > 0) {
    await settler.exceptions.bulkResolve({
      exceptionIds: lowSeverityExceptions.map(e => e.id),
      resolution: "ignored",
      notes: "Bulk resolved: Low-severity exceptions",
    });
    console.log(`Bulk resolved ${lowSeverityExceptions.length} exceptions`);
  }

  // Get exception statistics
  const stats = await settler.exceptions.stats({ jobId });
  console.log("Exception statistics:", stats.data);
}

main().catch(console.error);
