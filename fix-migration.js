const fs = require('fs');

const path = 'scripts/verify-backend-contract.ts';
let content = fs.readFileSync(path, 'utf8');

// Add import
const importStr = 'import { execSync } from "child_process";\n';
content = content.replace(
  'import * as path from "path";',
  'import * as path from "path";\n' + importStr
);

// Replace TODO
const replaceStr = `// TODO: Generate reconciliation migration
      try {
        execSync(\`npx tsx \${path.join(__dirname, "generate-reconciliation-migration.ts")} \${outputPath}\`, {
          stdio: "inherit",
        });
      } catch (e) {
        console.error("Failed to generate migration:", e instanceof Error ? e.message : String(e));
      }`;

content = content.replace('// TODO: Generate reconciliation migration', replaceStr);

fs.writeFileSync(path, content);
console.log('Fixed verify-backend-contract.ts');
