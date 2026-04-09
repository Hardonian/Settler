/**
 * Marketing Language Check Script
 *
 * Checks marketing materials for prohibited language and overly strong claims.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

interface Violation {
  file: string;
  line: number;
  text: string;
  issue: string;
}

const PROHIBITED_PATTERNS = [
  {
    pattern: /\beliminates\b/gi,
    replacement: "reduces",
    issue: 'Use "reduces" instead of "eliminates"',
  },
  {
    pattern: /\b100%\b/g,
    replacement: "high",
    issue: 'Use "high" or "99%+" instead of "100%"',
  },
  {
    pattern: /\bguarantee\b/gi,
    replacement: "SLA-backed (Enterprise)",
    issue: 'Use "SLA-backed (Enterprise)" or remove guarantee claim',
  },
  {
    pattern: /\bperfect\b/gi,
    replacement: "great",
    issue: 'Use "great" instead of "perfect"',
  },
  {
    pattern: /\bnever\b/gi,
    replacement: "designed to minimize",
    issue: 'Use "designed to minimize" instead of "never"',
  },
  {
    pattern: /\balways\b/gi,
    replacement: "typically",
    issue: 'Use "typically" or "usually" instead of "always"',
  },
  {
    pattern: /\bcompletely\b/gi,
    replacement: "significantly",
    issue: 'Use "significantly" instead of "completely"',
  },
];

const MARKETING_DIRS = [
  "marketing",
  "packages/web/src/app",
  "packages/web/src/components/marketing",
  "docs/external",
];

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (entry.endsWith(".md") || entry.endsWith(".tsx") || entry.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that don't exist
  }

  return files;
}

function checkFile(filePath: string): Violation[] {
  const violations: Violation[] = [];

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      for (const pattern of PROHIBITED_PATTERNS) {
        if (pattern.pattern.test(line)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            text: line.trim(),
            issue: pattern.issue,
          });
        }
      }
    }
  } catch (error) {
    // Skip files that can't be read
  }

  return violations;
}

async function main() {
  console.log("🔍 Checking marketing language...\n");

  const allFiles: string[] = [];

  for (const dir of MARKETING_DIRS) {
    const files = findMarkdownFiles(dir);
    allFiles.push(...files);
  }

  console.log(`Found ${allFiles.length} files to check\n`);

  const allViolations: Violation[] = [];

  for (const file of allFiles) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log("✅ No language violations found!\n");
    process.exit(0);
  }

  console.log(`❌ Found ${allViolations.length} violation(s):\n`);
  console.log("=".repeat(80));

  // Group by file
  const violationsByFile = new Map<string, Violation[]>();
  for (const violation of allViolations) {
    if (!violationsByFile.has(violation.file)) {
      violationsByFile.set(violation.file, []);
    }
    violationsByFile.get(violation.file)!.push(violation);
  }

  for (const [file, violations] of violationsByFile.entries()) {
    console.log(`\n📄 ${file}`);
    console.log("-".repeat(80));

    for (const violation of violations) {
      console.log(`  Line ${violation.line}: ${violation.issue}`);
      console.log(`  Text: ${violation.text.substring(0, 80)}...`);
      console.log("");
    }
  }

  console.log("=".repeat(80));
  console.log("\n💡 Recommendations:");
  console.log("1. Replace prohibited language with recommended alternatives");
  console.log("2. Review all marketing claims for accuracy");
  console.log("3. Update language standards if needed");
  console.log("\n");

  process.exit(1);
}

main().catch(console.error);
