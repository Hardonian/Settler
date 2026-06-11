const fs = require("fs");

const schemaPath = "supabase/production-schema.json";
const schemaData = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// The tables to drop are those in the SQL migration.
const migrationPath = fs
  .readdirSync("supabase/migrations")
  .find((f) => f.endsWith("_drop_unused_tables.sql"));
const migrationContent = fs.readFileSync("supabase/migrations/" + migrationPath, "utf8");

const tablesToDrop = [];
const regex = /DROP TABLE IF EXISTS "public"."([^"]+)"/g;
let match;
while ((match = regex.exec(migrationContent)) !== null) {
  tablesToDrop.push(match[1]);
}

schemaData.tables = schemaData.tables.filter((t) => {
  if (t.schema === "public" && tablesToDrop.includes(t.name)) {
    return false;
  }
  return true;
});

fs.writeFileSync(schemaPath, JSON.stringify(schemaData, null, 2));
console.info("Removed", tablesToDrop.length, "tables from production-schema.json");
