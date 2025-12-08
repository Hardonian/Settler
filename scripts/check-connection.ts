/**
 * Connection Checker
 * 
 * Checks if database connection is available and provides helpful guidance
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkConnection() {
  const connectionMethods = [
    {
      name: 'DATABASE_URL',
      value: process.env.DATABASE_URL,
      description: 'Direct PostgreSQL connection string',
    },
    {
      name: 'SUPABASE_URL + SUPABASE_DB_PASSWORD',
      value: process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD ? 'Set' : undefined,
      description: 'Supabase remote project',
    },
    {
      name: 'Local Supabase',
      value: 'localhost:54322',
      description: 'Local Supabase instance (requires supabase start)',
    },
  ];

  console.log('🔍 Checking database connection options...\n');

  for (const method of connectionMethods) {
    const status = method.value ? '✅' : '❌';
    console.log(`${status} ${method.name}`);
    if (method.value) {
      console.log(`   ${method.description}`);
      if (method.name === 'DATABASE_URL') {
        const masked = method.value.replace(/:[^:@]+@/, ':****@');
        console.log(`   ${masked}`);
      }
    } else {
      console.log(`   Not configured`);
    }
    console.log();
  }

  // Try to connect
  let connectionString = '';
  
  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
  } else if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (hostMatch) {
      const host = `${hostMatch[1]}.supabase.co`;
      connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${host}:5432/postgres`;
    }
  } else {
    connectionString = 'postgresql://postgres:postgres@localhost:54322/postgres';
  }

  console.log('🔌 Attempting connection...\n');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.SUPABASE_URL ? {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    } : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ Connection successful!\n');
    console.log('🚀 You can now run migrations with:');
    console.log('   npm run db:migrate:auto\n');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.log('❌ Connection failed\n');
    console.log('💡 To set up your connection:\n');
    
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
      console.log('Option 1: Remote Supabase Project');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Settings → Database → Connection string');
      console.log('   3. Set environment variables:');
      console.log('      export SUPABASE_URL="https://your-project.supabase.co"');
      console.log('      export SUPABASE_DB_PASSWORD="your-database-password"\n');
      
      console.log('Option 2: Local Supabase');
      console.log('   1. Install Supabase CLI: https://supabase.com/docs/guides/cli');
      console.log('   2. Run: supabase start');
      console.log('   3. Then run: npm run db:migrate:auto\n');
      
      console.log('Option 3: Custom PostgreSQL');
      console.log('   Set DATABASE_URL environment variable:\n');
      console.log('   export DATABASE_URL="postgresql://user:password@host:port/database"\n');
    } else {
      console.log(`   Error: ${error.message}\n`);
      console.log('   Check your connection settings and try again.\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  checkConnection().catch(console.error);
}

export { checkConnection };
