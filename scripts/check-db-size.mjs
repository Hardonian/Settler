import path from "path";
import dotenv from "dotenv";
import pg from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config({ path: path.resolve(".env.local") });
dotenv.config({ path: path.resolve(".env") });

const connStr =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL database.");

  const dbSizeRes = await client.query(
    "SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as raw_bytes;"
  );
  console.log("Database Total Size:", dbSizeRes.rows[0]);

  const tablesRes = await client.query(`
    SELECT
      schemaname,
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_size_pretty(pg_relation_size(relid)) as data_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
      pg_total_relation_size(relid) as bytes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows
    FROM pg_catalog.pg_stat_all_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 30;
  `);
  console.log("\nTop Tables Across All Schemas:");
  console.table(tablesRes.rows);

  const schemasRes = await client.query(`
    SELECT
      schemaname,
      pg_size_pretty(SUM(pg_total_relation_size(relid))) as total_schema_size,
      SUM(pg_total_relation_size(relid)) as bytes
    FROM pg_catalog.pg_stat_all_tables
    GROUP BY schemaname
    ORDER BY SUM(pg_total_relation_size(relid)) DESC;
  `);
  console.log("\nSchema Size Breakdown:");
  console.table(schemasRes.rows);

  const cronJobsRes = await client.query(
    "SELECT jobid, schedule, command, active, jobname FROM cron.job;"
  );
  console.log("\nRegistered Cron Jobs:");
  console.table(cronJobsRes.rows);

  const cronRunCount = await client.query("SELECT count(*) FROM cron.job_run_details;");
  console.log("cron.job_run_details row count:", cronRunCount.rows[0].count);

  const netCount = await client.query("SELECT count(*) FROM net._http_response;");
  console.log("net._http_response row count:", netCount.rows[0].count);

  const analytics1 = await client.query("SELECT count(*) FROM analytics.index_usage_snapshots;");
  console.log("analytics.index_usage_snapshots row count:", analytics1.rows[0].count);

  const analytics2 = await client.query("SELECT count(*) FROM analytics.index_candidates;");
  console.log("analytics.index_candidates row count:", analytics2.rows[0].count);
}

main()
  .catch((err) => {
    console.error("Error querying DB:", err);
  })
  .finally(() => client.end());
