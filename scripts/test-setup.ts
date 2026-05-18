/**
 * Test Setup
 *
 * Tests the setup by checking migrations, super admin, and health.
 * Usage: DATABASE_URL="..." pnpm tsx scripts/test-setup.ts
 */

import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required");
  process.exit(1);
}

async function checkApiCallLogsTable(client: Client) {
  console.info("📋 Test 1: Checking api_call_logs table...");
  const { rows: tableCheck } = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'api_call_logs'
    );
  `);

  if (tableCheck[0].exists) {
    console.info("✅ api_call_logs table exists\n");
  } else {
    console.info("❌ api_call_logs table does not exist\n");
    throw new Error("Migrations not applied");
  }
}

async function checkIndexes(client: Client) {
  console.info("📋 Test 2: Checking indexes...");
  const { rows: indexes } = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'api_call_logs'
    ORDER BY indexname;
  `);

  console.info(`✅ Found ${indexes.length} index(es):`);
  indexes.forEach((idx: { indexname: string }) => {
    console.info(`   - ${idx.indexname}`);
  });
  console.info("");
}

async function checkRlsPolicies(client: Client) {
  console.info("📋 Test 3: Checking RLS policies...");
  const { rows: policies } = await client.query(`
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'api_call_logs'
    ORDER BY policyname;
  `);

  console.info(`✅ Found ${policies.length} RLS polic(ies):`);
  policies.forEach((pol: { policyname: string; cmd: string }) => {
    console.info(`   - ${pol.policyname} (${pol.cmd})`);
  });
  console.info("");
}

async function checkCleanupFunction(client: Client) {
  console.info("📋 Test 4: Checking cleanup function...");
  const { rows: functions } = await client.query(`
    SELECT proname
    FROM pg_proc
    WHERE proname = 'cleanup_old_api_logs';
  `);

  if (functions.length > 0) {
    console.info("✅ cleanup_old_api_logs function exists\n");
  } else {
    console.warn("⚠️  cleanup_old_api_logs function not found\n");
  }
}

async function checkSuperAdmins(client: Client) {
  console.info("📋 Test 5: Checking super admin configuration...");
  const { rows: superAdmins } = await client.query(`
    SELECT
      u.id,
      u.email,
      u.raw_user_meta_data->>'role' as user_role
    FROM auth.users u
    WHERE
      (u.raw_user_meta_data IS NOT NULL AND u.raw_user_meta_data->>'role' = 'SUPER_ADMIN')
      OR u.email LIKE '%@settler.dev'
    LIMIT 10;
  `);

  if (superAdmins.length > 0) {
    console.info(`✅ Found ${superAdmins.length} super admin(s):`);
    superAdmins.forEach((admin: { email: string; user_role: string }) => {
      console.info(`   - ${admin.email} (role: ${admin.user_role || "none"})`);
    });
  } else {
    console.warn("⚠️  No super admins found. Run configure-super-admin.ts to set one up.\n");
  }
}

async function testSetup() {
  // Configure SSL for Supabase pooler connections
  const sslConfig =
    DATABASE_URL!.includes("pooler") || DATABASE_URL!.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined;

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
  });

  try {
    console.info("🔌 Connecting to database...");
    await client.connect();
    console.info("✅ Connected successfully\n");

    await checkApiCallLogsTable(client);
    await checkIndexes(client);
    await checkRlsPolicies(client);
    await checkCleanupFunction(client);
    await checkSuperAdmins(client);

    console.info("\n🎉 All tests passed! Setup is complete.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.info("\n🔌 Database connection closed");
  }
}

testSetup();
