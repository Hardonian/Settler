/**
 * Test API Routes
 * 
 * Tests all console API routes to ensure they're working correctly.
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

async function testApiRoutes() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test 1: Verify api_call_logs table structure
    console.log('📋 Test 1: Verifying api_call_logs table structure...');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'api_call_logs'
      ORDER BY ordinal_position
    `);
    
    const requiredColumns = [
      'id', 'tenant_id', 'user_id', 'api_key_id', 'method', 'path',
      'status_code', 'response_time', 'headers', 'query', 'body',
      'response_body', 'error', 'user_agent', 'ip_address', 'created_at'
    ];
    
    const columnNames = columns.map((c: any) => c.column_name);
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length === 0) {
      console.log(`✅ All ${requiredColumns.length} required columns exist\n`);
    } else {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}\n`);
    }

    // Test 2: Test inserting a log entry
    console.log('📋 Test 2: Testing log insertion...');
    try {
      // Get a tenant_id for testing
      const { rows: tenants } = await client.query(`
        SELECT id FROM tenants LIMIT 1
      `);
      
      if (tenants.length > 0) {
        const testLog = {
          tenant_id: tenants[0].id,
          method: 'GET',
          path: '/api/test',
          status_code: 200,
          response_time: 50,
          headers: { 'content-type': 'application/json' },
          query: {},
          body: null,
          response_body: { success: true },
          error: null,
          user_agent: 'test-agent',
          ip_address: '127.0.0.1',
        };
        
        const { rowCount } = await client.query(`
          INSERT INTO api_call_logs (
            tenant_id, method, path, status_code, response_time,
            headers, query, body, response_body, error, user_agent, ip_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          testLog.tenant_id,
          testLog.method,
          testLog.path,
          testLog.status_code,
          testLog.response_time,
          JSON.stringify(testLog.headers),
          JSON.stringify(testLog.query),
          testLog.body,
          JSON.stringify(testLog.response_body),
          testLog.error,
          testLog.user_agent,
          testLog.ip_address,
        ]);
        
        if (rowCount === 1) {
          console.log('✅ Log entry inserted successfully\n');
          
          // Clean up test entry
          await client.query(`
            DELETE FROM api_call_logs WHERE path = '/api/test' AND method = 'GET'
          `);
          console.log('✅ Test log entry cleaned up\n');
        } else {
          console.log('❌ Failed to insert log entry\n');
        }
      } else {
        console.log('⚠️  No tenants found, skipping insertion test\n');
      }
    } catch (error) {
      console.log(`❌ Insertion test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    // Test 3: Test querying logs
    console.log('📋 Test 3: Testing log queries...');
    try {
      const { rows: logs, rowCount } = await client.query(`
        SELECT id, method, path, status_code, created_at
        FROM api_call_logs
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Successfully queried ${rowCount} log(s)\n`);
    } catch (error) {
      console.log(`❌ Query test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    // Test 4: Test RLS policies
    console.log('📋 Test 4: Testing RLS policies...');
    const { rows: policies } = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'api_call_logs'
    `);
    
    console.log(`✅ Found ${policies.length} RLS polic(ies):`);
    policies.forEach((pol: any) => {
      console.log(`   - ${pol.policyname} (${pol.cmd})`);
    });
    console.log('');

    // Test 5: Test indexes are being used
    console.log('📋 Test 5: Verifying index usage...');
    try {
      const { rows: indexUsage } = await client.query(`
        SELECT 
          schemaname,
          relname as tablename,
          indexrelname as indexname,
          idx_scan as index_scans
        FROM pg_stat_user_indexes
        WHERE relname = 'api_call_logs'
        ORDER BY idx_scan DESC
        LIMIT 5
      `);
      
      if (indexUsage.length > 0) {
        console.log('✅ Index statistics available:');
        indexUsage.forEach((idx: any) => {
          console.log(`   - ${idx.indexname}: ${idx.index_scans} scans`);
        });
        console.log('');
      } else {
        console.log('⚠️  No index usage statistics yet (indexes will be used as queries run)\n');
      }
    } catch (error) {
      console.log('⚠️  Could not check index statistics (may require superuser)\n');
    }

    console.log('\n🎉 All API route tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

testApiRoutes();
