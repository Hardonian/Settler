import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const CHECK_LIST = [
  {
    name: "Homepage Title",
    file: "packages/web/src/app/page.tsx",
    pattern: /title:\s*"Settler\s*—\s*Reconciliation\s*intelligence\s*\+\s*audit\s*OS"/,
  },
  {
    name: "Pricing Plans",
    file: "packages/web/src/app/pricing/page.tsx",
    pattern: /COMMERCIAL_OFFERS/,
  },
  {
    name: "Trust Page",
    file: "packages/web/src/app/security-and-audit/page.tsx",
    pattern: /Security Architecture/,
  },
  {
    name: "Empty Runs State",
    file: "packages/web/src/app/console/runs/page.tsx",
    pattern: /"No reconciliation runs yet"/,
  },
  {
    name: "README Quickstart",
    file: "README.md",
    pattern: /## Quick Start/,
  },
];

async function run() {
  console.log("🚀 RUNNING FLASH VERIFICATION PASS\n");
  let failures = 0;

  for (const check of CHECK_LIST) {
    const filePath = path.join(rootDir, check.file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${check.name.padEnd(25)} | File missing: ${check.file}`);
      failures++;
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name.padEnd(25)} | Pattern matched`);
    } else {
      console.log(`❌ ${check.name.padEnd(25)} | Pattern not found in ${check.file}`);
      failures++;
    }
  }

  console.log(`\n📊 SUMMARY: ${CHECK_LIST.length - failures} passed, ${failures} failed.`);
  if (failures > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
