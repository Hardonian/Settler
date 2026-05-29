const fs = require("fs");
const content = fs.readFileSync("scripts/verify-backend-contract.ts", "utf8");

const updated = content.replace(
  "// TODO: Generate reconciliation migration",
  `// TODO: Generate reconciliation migration
      console.log("Calling generation script...");
      const { execSync } = require("child_process");
      try {
        execSync(\`npx tsx \${path.join(__dirname, "generate-reconciliation-migration.ts")} \${outputPath}\`, { stdio: "inherit" });
      } catch (e) {
        console.error("Failed to generate migration:", e.message);
      }`
);

fs.writeFileSync("scripts/verify-backend-contract.ts", updated);
console.log("updated");
