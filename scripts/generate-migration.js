const fs = require("fs");

const schemaData = JSON.parse(fs.readFileSync("supabase/production-schema.json", "utf8"));
const signals = JSON.parse(fs.readFileSync("supabase/pipe-dream-signals.json", "utf8")).signals;

const unusedTables = signals
  .filter((s) => s.type === "table_no_consumer")
  .map((s) => {
    const match = s.description.match(/Table "([^"]+)"/);
    return match ? match[1] : null;
  })
  .filter(Boolean);

const publicTables = schemaData.tables.filter((t) => t.schema === "public").map((t) => t.name);

const tablesToDrop = unusedTables.filter((t) => publicTables.includes(t));

const date = new Date();
const timestamp = date
  .toISOString()
  .replace(/[-:T.]/g, "")
  .substring(0, 14);

let sql = `-- Migration to drop unused tables identified by pipe-dreams scanner\n\n`;
tablesToDrop.forEach((t) => {
  sql += `DROP TABLE IF EXISTS "public"."${t}" CASCADE;\n`;
});

const migrationPath = `supabase/migrations/${timestamp}_drop_unused_tables.sql`;
fs.writeFileSync(migrationPath, sql);

console.log("Created migration:", migrationPath);
console.log("Tables to drop:", tablesToDrop.join(", "));
