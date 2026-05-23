const { execSync } = require("child_process");
execSync("npx tsx scripts/generate-reconciliation-migration.ts supabase/backend-verification-results.json", { stdio: "inherit" });
