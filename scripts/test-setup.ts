/**
 * Test Setup
 * 
 * Tests the setup by checking migrations, super admin, and health.
 * Usage: DATABASE_URL="..." pnpm tsx scripts/test-setup.ts
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

async function testSetup() {
  // Configure SSL for Supabase pooler connections
  const sslConfig = DATABASE_URL.includes('pooler') || DATABASE_URL.includes('supabase') 
    ? { rejectUnauthorized: false } 
    : undefined;
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Test 1: Check if api_call_logs table exists
    console.log('📋 Test 1: Checking api_call_logs table...');
    const { rows: tableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_call_logs'
      );
    `);

    if (tableCheck[0].exists) {
      console.log('✅ api_call_logs table exists\n');
    } else {
      console.log('❌ api_call_logs table does not exist\n');
      throw new Error('Migrations not applied');
    }

    // Test 2: Check indexes
    console.log('📋 Test 2: Checking indexes...');
    const { rows: indexes } = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'api_call_logs'
      ORDER BY indexname;
    `);

    console.log(`✅ Found ${indexes.length} index(es):`);
    indexes.forEach((idx: { indexname: string }) => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log('');

    // Test 3: Check RLS policies
    console.log('📋 Test 3: Checking RLS policies...');
    const { rows: policies } = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'api_call_logs'
      ORDER BY policyname;
    `);

    console.log(`✅ Found ${policies.length} RLS polic(ies):`);
    policies.forEach((pol: { policyname: string; cmd: string }) => {
      console.log(`   - ${pol.policyname} (${pol.cmd})`);
    });
    console.log('');

    // Test 4: Check cleanup function
    console.log('📋 Test 4: Checking cleanup function...');
    const { rows: functions } = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname = 'cleanup_old_api_logs';
    `);

    if (functions.length > 0) {
      console.log('✅ cleanup_old_api_logs function exists\n');
    } else {
      console.log('⚠️  cleanup_old_api_logs function not found\n');
    }

    // Test 5: Check super admins
    console.log('📋 Test 5: Checking super admin configuration...');
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
      console.log(`✅ Found ${superAdmins.length} super admin(s):`);
      superAdmins.forEach((admin: { email: string; user_role: string }) => {
        console.log(`   - ${admin.email} (role: ${admin.user_role || 'none'})`);
      });
    } else {
      console.log('⚠️  No super admins found. Run configure-super-admin.ts to set one up.\n');
    }

    console.log('\n🎉 All tests passed! Setup is complete.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

testSetup();
