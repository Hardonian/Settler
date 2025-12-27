/**
 * Configure Super Admin
 * 
 * Sets up super admin access for a user.
 * Usage: DATABASE_URL="..." USER_EMAIL="user@example.com" pnpm tsx scripts/configure-super-admin.ts
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const USER_EMAIL = process.env.USER_EMAIL || process.env.SUPABASE_USER_EMAIL;
const USER_ID = process.env.USER_ID;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

if (!USER_EMAIL && !USER_ID) {
  console.error('❌ USER_EMAIL or USER_ID environment variable is required');
  console.error('   Example: USER_EMAIL="admin@settler.dev"');
  process.exit(1);
}

async function configureSuperAdmin() {
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

    let userId: string | null = null;

    // Get user ID from email if provided
    if (USER_EMAIL) {
      console.log(`🔍 Looking up user by email: ${USER_EMAIL}`);
      const { rows } = await client.query(
        `SELECT id FROM auth.users WHERE email = $1`,
        [USER_EMAIL]
      );

      if (rows.length === 0) {
        console.error(`❌ User with email ${USER_EMAIL} not found`);
        process.exit(1);
      }

      userId = rows[0].id;
      console.log(`✅ Found user ID: ${userId}\n`);
    } else {
      userId = USER_ID!;
      console.log(`✅ Using provided user ID: ${userId}\n`);
    }

    // Method 1: Set in user metadata (billing_accounts may not have metadata column)
    console.log('📝 Setting super admin role in user metadata...');

    // Set in user metadata (primary method)
    const { rowCount: userCount } = await client.query(
      `UPDATE auth.users
       SET raw_user_meta_data = jsonb_set(
         COALESCE(raw_user_meta_data, '{}'),
         '{role}',
         '"SUPER_ADMIN"'
       )
       WHERE id = $1`,
      [userId]
    );

    console.log(`✅ Updated ${userCount} user(s)\n`);
    
    // Also try to add metadata column to billing_accounts if it doesn't exist
    try {
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'billing_accounts' AND column_name = 'metadata'
          ) THEN
            ALTER TABLE billing_accounts ADD COLUMN metadata JSONB DEFAULT '{}';
          END IF;
        END $$;
      `);
      
      // Now set in billing_account metadata too
      const { rowCount: billingCount } = await client.query(
        `UPDATE billing_accounts
         SET metadata = jsonb_set(
           COALESCE(metadata, '{}'),
           '{role}',
           '"SUPER_ADMIN"'
         )
         WHERE user_id = $1`,
        [userId]
      );
      
      if (billingCount > 0) {
        console.log(`✅ Also updated ${billingCount} billing_account(s) metadata\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not update billing_account metadata (column may not exist)\n');
    }

    // Verify configuration
    console.log('🔍 Verifying super admin configuration...');
    const { rows: verifyRows } = await client.query(
      `SELECT 
         ba.metadata->>'role' as billing_role,
         u.raw_user_meta_data->>'role' as user_role,
         u.email
       FROM auth.users u
       LEFT JOIN billing_accounts ba ON ba.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (verifyRows.length > 0) {
      const verification = verifyRows[0];
      console.log(`\n📊 Verification Results:`);
      console.log(`   Email: ${verification.email}`);
      console.log(`   Billing Account Role: ${verification.billing_role || 'not set'}`);
      console.log(`   User Metadata Role: ${verification.user_role || 'not set'}`);
      
      if (verification.billing_role === 'SUPER_ADMIN' || verification.user_role === 'SUPER_ADMIN') {
        console.log(`\n✅ Super admin successfully configured!`);
      } else {
        console.log(`\n⚠️  Super admin role not found in verification. Please check manually.`);
      }
    }

    console.log('\n🎉 Configuration complete!');
  } catch (error) {
    console.error('❌ Configuration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

configureSuperAdmin();
