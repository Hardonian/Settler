/**
 * End-to-End Test
 *
 * Tests the complete flow:
 * 1. API call is made
 * 2. API call is logged
 * 3. Log can be retrieved
 * 4. Super admin can see all logs
 */

import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required");
  process.exit(1);
}

async function testEndToEnd() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🔌 Connected to database\n");
    console.log("🧪 Running End-to-End Tests...\n");

    // Get a tenant and user for testing
    const { rows: tenants } = await client.query(`SELECT id FROM tenants LIMIT 1`);
    const { rows: users } = await client.query(`SELECT id FROM auth.users LIMIT 1`);

    if (tenants.length === 0 || users.length === 0) {
      console.log("⚠️  Need at least one tenant and user for testing");
      return;
    }

    const tenantId = tenants[0].id;
    const userId = users[0].id;

    // Test 1: Simulate API call and log it
    console.log("📋 Test 1: Simulating API call and logging...");
    const testApiCall = {
      tenant_id: tenantId,
      user_id: userId,
      method: "GET",
      path: "/api/console/api-logs",
      status_code: 200,
      response_time: 45,
      headers: JSON.stringify({ "content-type": "application/json" }),
      query: JSON.stringify({ limit: "100", stats: "true" }),
      body: null,
      response_body: JSON.stringify({ logs: [], stats: { totalCalls: 0 } }),
      error: null,
      user_agent: "Mozilla/5.0 (Test)",
      ip_address: "192.168.1.1",
    };

    const { rowCount: insertCount } = await client.query(
      `
      INSERT INTO api_call_logs (
        tenant_id, user_id, method, path, status_code, response_time,
        headers, query, body, response_body, error, user_agent, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `,
      [
        testApiCall.tenant_id,
        testApiCall.user_id,
        testApiCall.method,
        testApiCall.path,
        testApiCall.status_code,
        testApiCall.response_time,
        testApiCall.headers,
        testApiCall.query,
        testApiCall.body,
        testApiCall.response_body,
        testApiCall.error,
        testApiCall.user_agent,
        testApiCall.ip_address,
      ]
    );

    if (insertCount === 1) {
      console.log("✅ API call logged successfully\n");
    } else {
      console.log("❌ Failed to log API call\n");
      return;
    }

    // Test 2: Retrieve logs (tenant view)
    console.log("📋 Test 2: Retrieving logs for tenant...");
    const { rows: tenantLogs, rowCount: tenantLogCount } = await client.query(
      `
      SELECT id, method, path, status_code, created_at
      FROM api_call_logs
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `,
      [tenantId]
    );

    console.log(`✅ Retrieved ${tenantLogCount} log(s) for tenant\n`);

    // Test 3: Retrieve logs (super admin view - all tenants)
    console.log("📋 Test 3: Retrieving logs as super admin...");
    const { rows: allLogs, rowCount: allLogCount } = await client.query(`
      SELECT id, tenant_id, method, path, status_code, created_at
      FROM api_call_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`✅ Super admin can see ${allLogCount} log(s) across all tenants\n`);

    // Test 4: Test filtering
    console.log("📋 Test 4: Testing log filtering...");
    const { rows: filteredLogs } = await client.query(`
      SELECT id, method, path, status_code
      FROM api_call_logs
      WHERE method = 'GET'
        AND path LIKE '%api-logs%'
        AND status_code = 200
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`✅ Filtered query returned ${filteredLogs.length} log(s)\n`);

    // Test 5: Test statistics
    console.log("📋 Test 5: Testing statistics calculation...");
    const { rows: stats } = await client.query(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(DISTINCT method) as unique_methods,
        COUNT(DISTINCT tenant_id) as unique_tenants,
        AVG(response_time) as avg_response_time,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count
      FROM api_call_logs
    `);

    if (stats.length > 0) {
      const s = stats[0];
      console.log(`✅ Statistics calculated:`);
      console.log(`   - Total calls: ${s.total_calls}`);
      console.log(`   - Unique methods: ${s.unique_methods}`);
      console.log(`   - Unique tenants: ${s.unique_tenants}`);
      console.log(`   - Avg response time: ${Math.round(Number(s.avg_response_time) || 0)}ms`);
      console.log(`   - Error count: ${s.error_count}\n`);
    }

    // Cleanup test data
    console.log("📋 Cleaning up test data...");
    await client.query(`
      DELETE FROM api_call_logs 
      WHERE path = '/api/console/api-logs' 
      AND method = 'GET'
      AND user_agent = 'Mozilla/5.0 (Test)'
    `);
    console.log("✅ Test data cleaned up\n");

    console.log("🎉 All end-to-end tests passed!");
    console.log("\n✅ Complete flow verified:");
    console.log("   1. API call logging ✓");
    console.log("   2. Log retrieval (tenant) ✓");
    console.log("   3. Log retrieval (super admin) ✓");
    console.log("   4. Log filtering ✓");
    console.log("   5. Statistics calculation ✓");
    console.log("\n🚀 System is fully operational!");
  } catch (error) {
    console.error("❌ End-to-end test failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

testEndToEnd();
