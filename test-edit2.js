const fs = require('fs');
let content = fs.readFileSync('scripts/verify-backend-contract.ts', 'utf8');

const importStatement = `import { execSync } from "child_process";\n`;
if (!content.includes(importStatement)) {
    content = content.replace('import * as path from "path";', 'import * as path from "path";\n' + importStatement);
}

content = content.replace(
  `      console.log("Calling generation script...");\n      const { execSync } = require("child_process");\n      try {\n        execSync(\\\`npx tsx \${path.join(__dirname, "generate-reconciliation-migration.ts")} \${outputPath}\\\`, { stdio: "inherit" });\n      } catch (e) {\n        console.error("Failed to generate migration:", e.message);\n      }`,
  `      try {\n        execSync(\\\`npx tsx \${path.join(__dirname, "generate-reconciliation-migration.ts")} \${outputPath}\\\`, {\n          stdio: "inherit",\n        });\n      } catch (e) {\n        console.error("Failed to generate migration:", e instanceof Error ? e.message : String(e));\n      }`
);

fs.writeFileSync('scripts/verify-backend-contract.ts', content);
console.log('updated 2');
