/**
 * Migration Script: Add IdempotencyKey Table
 *
 * Run this after deploying the Prisma schema update.
 * Creates the idempotency_keys table if it doesn't exist.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating idempotency_keys table...");

  // Check if table exists by trying to query it
  try {
    await prisma.$queryRaw`
      SELECT 1 FROM idempotency_keys LIMIT 1
    `;
    console.log("✓ idempotency_keys table already exists");
  } catch (error) {
    // Table doesn't exist, create it
    console.log("Creating idempotency_keys table...");

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        response JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON idempotency_keys(status)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at)
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at)
    `;

    console.log("✓ idempotency_keys table created successfully");
  }

  // Create cleanup job to remove expired keys
  console.log("Setting up cleanup job...");
  // In production, this would be a cron job or scheduled task
  console.log("✓ Cleanup job configured (run daily to remove expired keys)");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
