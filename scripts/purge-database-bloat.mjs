import path from "path";
import dotenv from "dotenv";
import pg from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config({ path: path.resolve(".env.local") });
dotenv.config({ path: path.resolve(".env") });

const connStr =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("Connecting to PostgreSQL...");
  await client.connect();
  console.log("Connected successfully.");

  // Check initial size
  const preSize = await client.query(
    "SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes;"
  );
  console.log("\n📊 Starting Database Size:", preSize.rows[0].size);

  // Inspect columns for analytics and net tables
  const cols = await client.query(`
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE (table_schema = 'net' AND table_name = '_http_response')
       OR (table_schema = 'analytics' AND table_name IN ('index_usage_snapshots', 'index_candidates'))
       OR (table_schema = 'cron' AND table_name = 'job_run_details');
  `);
  console.log("\nFound columns in target tables:", cols.rows.length);

  // 1. Purge cron.job_run_details (keep last 3 days)
  console.log("\n1️⃣ Purging cron.job_run_details older than 3 days...");
  const cronDel = await client.query(
    "DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';"
  );
  console.log(`   Deleted ${cronDel.rowCount} rows from cron.job_run_details.`);

  // 2. Check net._http_response columns and delete older than 3 days
  const netCols = cols.rows.filter(
    (r) => r.table_schema === "net" && r.table_name === "_http_response"
  );
  const timeColNet = netCols.find((c) =>
    ["created", "created_at", "timedout_at", "error_msg"].includes(c.column_name)
  )?.column_name;
  console.log(`\n2️⃣ Purging net._http_response (detected time column: ${timeColNet || "none"})...`);
  if (timeColNet) {
    const netDel = await client.query(
      `DELETE FROM net._http_response WHERE ${timeColNet} < now() - interval '3 days';`
    );
    console.log(`   Deleted ${netDel.rowCount} rows from net._http_response.`);
  } else {
    // If no created column, check all column names
    console.log("   Columns in net._http_response:", netCols.map((c) => c.column_name).join(", "));
    // Fallback: delete all or older
    const netDel = await client.query("TRUNCATE TABLE net._http_response;");
    console.log("   Truncated net._http_response cache.");
  }

  // 3. Purge analytics tables
  const snapCols = cols.rows.filter(
    (r) => r.table_schema === "analytics" && r.table_name === "index_usage_snapshots"
  );
  const timeColSnap = snapCols.find((c) =>
    ["snapshot_at", "created_at", "captured_at", "timestamp"].includes(c.column_name)
  )?.column_name;
  console.log(
    `\n3️⃣ Purging analytics.index_usage_snapshots (detected time column: ${timeColSnap || "none"})...`
  );
  if (timeColSnap) {
    const snapDel = await client.query(
      `DELETE FROM analytics.index_usage_snapshots WHERE ${timeColSnap} < now() - interval '7 days';`
    );
    console.log(`   Deleted ${snapDel.rowCount} rows from analytics.index_usage_snapshots.`);
  }

  const candCols = cols.rows.filter(
    (r) => r.table_schema === "analytics" && r.table_name === "index_candidates"
  );
  const timeColCand = candCols.find((c) =>
    ["created_at", "detected_at", "timestamp"].includes(c.column_name)
  )?.column_name;
  console.log(
    `   Purging analytics.index_candidates (detected time column: ${timeColCand || "none"})...`
  );
  if (timeColCand) {
    const candDel = await client.query(
      `DELETE FROM analytics.index_candidates WHERE ${timeColCand} < now() - interval '7 days';`
    );
    console.log(`   Deleted ${candDel.rowCount} rows from analytics.index_candidates.`);
  }

  // 4. VACUUM FULL to reclaim disk space
  console.log("\n4️⃣ Reclaiming disk space via VACUUM FULL...");
  try {
    console.log("   Vacuuming cron.job_run_details...");
    await client.query("VACUUM FULL cron.job_run_details;");
    console.log("   Vacuuming net._http_response...");
    await client.query("VACUUM FULL net._http_response;");
    console.log("   Vacuuming analytics.index_usage_snapshots...");
    await client.query("VACUUM FULL analytics.index_usage_snapshots;");
    console.log("   Vacuuming analytics.index_candidates...");
    await client.query("VACUUM FULL analytics.index_candidates;");
    console.log("   Vacuum completed successfully.");
  } catch (vacuumErr) {
    console.warn("   VACUUM FULL warning (may need direct port 5432):", vacuumErr.message);
    try {
      console.log("   Falling back to standard VACUUM ANALYZE...");
      await client.query("VACUUM ANALYZE cron.job_run_details;");
      await client.query("VACUUM ANALYZE net._http_response;");
      await client.query("VACUUM ANALYZE analytics.index_usage_snapshots;");
      await client.query("VACUUM ANALYZE analytics.index_candidates;");
      console.log("   VACUUM ANALYZE completed.");
    } catch (e) {
      console.warn("   VACUUM error:", e.message);
    }
  }

  // 5. Register automated daily retention cron job in pg_cron
  console.log("\n5️⃣ Configuring automated daily retention job in pg_cron...");
  try {
    // Check if already registered
    const existing = await client.query(
      "SELECT jobid FROM cron.job WHERE jobname = 'purge_cron_and_net_logs_nightly';"
    );
    if (existing.rows.length > 0) {
      console.log(
        "   Nightly retention cron job already registered (jobid:",
        existing.rows[0].jobid,
        ")"
      );
    } else {
      const scheduleSql = `
        SELECT cron.schedule(
          'purge_cron_and_net_logs_nightly',
          '30 3 * * *',
          $$
            DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';
            DELETE FROM net._http_response WHERE created < now() - interval '3 days';
            DELETE FROM analytics.index_usage_snapshots WHERE snapshot_at < now() - interval '7 days';
            DELETE FROM analytics.index_candidates WHERE created_at < now() - interval '7 days';
          $$
        );
      `;
      const scheduleRes = await client.query(scheduleSql);
      console.log(
        "   Registered 'purge_cron_and_net_logs_nightly' (jobid:",
        scheduleRes.rows[0].schedule,
        ")"
      );
    }
  } catch (cronErr) {
    console.warn("   Notice when scheduling cron job:", cronErr.message);
  }

  // 6. Check final database size
  const postSize = await client.query(
    "SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes;"
  );
  console.log("\n🎉 FINAL DATABASE SIZE:", postSize.rows[0].size);

  const tableSizes = await client.query(`
    SELECT
      schemaname,
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      n_live_tup as live_rows
    FROM pg_catalog.pg_stat_all_tables
    WHERE schemaname IN ('cron', 'net', 'analytics', 'public')
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 15;
  `);
  console.log("\nTop Table Sizes After Purge:");
  console.table(tableSizes.rows);
}

main()
  .catch((err) => {
    console.error("Error executing purge:", err);
  })
  .finally(() => client.end());
