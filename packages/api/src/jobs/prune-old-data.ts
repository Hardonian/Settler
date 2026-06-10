import { prisma } from "../infrastructure/db/prisma";
import { logInfo, logError } from "../utils/logger";

async function run() {
  logInfo("Starting data pruning job");

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // Prune raw ingestion payloads older than 90 days to save DB storage costs
    const { count } = await prisma.rawIngestionPayload.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logInfo(`Successfully pruned ${count} old ingestion payloads.`);
  } catch (error) {
    logError("Data pruning job failed", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Execute if run directly
run();
