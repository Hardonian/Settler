const fs = require("fs");
const path = require("path");

const routesDir = path.join(process.cwd(), "packages", "api", "src", "routes");
const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("import { query") || content.includes("import { query,")) {
        // Find how many times query( is called
        const queryCalls = (content.match(/query\(/g) || []).length;
        if (queryCalls > 0) {
          // Check for manual tenant_id filtering
          const hasManualFilter =
            content.includes("tenant_id = $") ||
            content.includes("tenant_id=$") ||
            content.includes("tenant_id IN");
          results.push({
            file: path.relative(process.cwd(), fullPath),
            queryCalls,
            hasManualFilter,
          });
        }
      }
    }
  }
}

scanDir(routesDir);
console.log(JSON.stringify(results, null, 2));
