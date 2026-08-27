const fs = require("fs");
const path = require("path");

const schemaPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20240101000000_settler_golden_schema.sql"
);
let sql = fs.readFileSync(schemaPath, "utf8");

// The proper RLS condition
const RLS_CONDITION =
  "tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid";

// We want to find `CREATE POLICY name ON table_name \n  FOR SELECT \n  USING (true)`
// First, let's map tables to whether they have a tenant_id column
const tableHasTenantId = new Set();
const createTableRegex = /CREATE TABLE IF NOT EXISTS public\.([a-z_]+)\s*\(([\s\S]*?)\);/g;
let match;
while ((match = createTableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const columns = match[2];
  if (columns.includes("tenant_id ")) {
    tableHasTenantId.add(tableName);
  }
}

console.log("Tables with tenant_id:", tableHasTenantId);

// Now find policies
const policyRegex =
  /CREATE POLICY (\w+) ON public\.([a-z_]+)\s+FOR (SELECT|ALL|UPDATE|INSERT|DELETE)\s+USING \(true\)/g;
let replaceCount = 0;

sql = sql.replace(policyRegex, (match, policyName, tableName, action) => {
  if (tableHasTenantId.has(tableName)) {
    console.log(`Fixing policy ${policyName} on table ${tableName}`);
    replaceCount++;
    return `CREATE POLICY ${policyName} ON public.${tableName}\n  FOR ${action}\n  USING (${RLS_CONDITION})`;
  } else {
    console.log(`Skipping policy ${policyName} on table ${tableName} (no tenant_id)`);
    return match;
  }
});

console.log(`Replaced ${replaceCount} policies.`);

fs.writeFileSync(schemaPath, sql);
