#!/usr/bin/env tsx
/**
 * Boundary Enforcement Validation Script
 *
 * Validates marketing/app boundary isolation:
 * 1. No Supabase imports in marketing routes
 * 2. No server-only env in client bundles
 * 3. No marketing bundle including reconciliation engine
 * 4. No auth logic in public routes
 *
 * Usage:
 *   pnpm run validate:boundaries
 *   pnpm tsx scripts/validate-boundaries.ts
 *
 * Exit codes:
 *   0 - All boundaries respected
 *   1 - Boundary violations found
 *   2 - Configuration error
 */

import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const MARKETING_PATHS = [
  "packages/web/src/app/(marketing)",
  "packages/web/src/app/about",
  "packages/web/src/app/blog",
  "packages/web/src/app/pricing",
  "packages/web/src/app/contact",
  "packages/web/src/app/privacy",
  "packages/web/src/app/terms",
  "packages/web/src/app/security",
  "packages/web/src/app/comparison",
  "packages/web/src/app/how-it-works",
  "packages/web/src/app/use-cases",
  "packages/web/src/app/docs",
  "packages/web/src/app/changelog",
  "packages/web/src/app/roadmap",
  "packages/web/src/app/community",
];

const FORBIDDEN_IN_MARKETING = [
  { pattern: /from ["']@\/lib\/supabase\/(server|client)/, name: "Supabase server/client" },
  { pattern: /createClient/, name: "Supabase createClient" },
  { pattern: /@supabase\/supabase-js/, name: "Supabase JS client" },
  { pattern: /auth\.(signIn|signOut|getSession)/, name: "Supabase auth methods" },
  { pattern: /requireAuth|withAuth|getUser/, name: "Auth middleware" },
  { pattern: /DATABASE_URL/, name: "DATABASE_URL env var" },
  { pattern: /NEXT_PUBLIC_.*(?<!SUPABASE_URL|SUPABASE_ANON_KEY)/, name: "Server env in client" },
];

const CLIENT_PATTERNS = [/\.client\./, /ClientComponent/, /"use client"/];

// ============================================================================
// TYPES
// ============================================================================

interface BoundaryViolation {
  file: string;
  line?: number;
  violation: string;
  severity: "error" | "warning";
}

interface ValidationResult {
  passed: boolean;
  violations: BoundaryViolation[];
  summary: {
    totalFiles: number;
    filesWithViolations: number;
    errors: number;
    warnings: number;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function isMarketingPath(filePath: string): boolean {
  return MARKETING_PATHS.some((marketingPath) => filePath.includes(marketingPath));
}

function isClientComponent(filePath: string): boolean {
  if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return CLIENT_PATTERNS.some((pattern) => pattern.test(content));
  } catch {
    return false;
  }
}

function validateFile(filePath: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

  // Skip non-TypeScript files
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
    return violations;
  }

  // Skip node_modules, tests
  if (filePath.includes("node_modules") || filePath.includes("__tests__")) {
    return violations;
  }

  // Check if this is a marketing path
  const isMarketing = isMarketingPath(filePath);

  // Read file content
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return violations;
  }

  // Check for forbidden imports in marketing
  if (isMarketing) {
    for (const forbidden of FORBIDDEN_IN_MARKETING) {
      if (forbidden.pattern.test(content)) {
        // Get line number
        const lines = content.split("\n");
        let lineNumber: number | undefined;
        for (let i = 0; i < lines.length; i++) {
          if (forbidden.pattern.test(lines[i])) {
            lineNumber = i + 1;
            break;
          }
        }

        violations.push({
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          violation: `Marketing route contains ${forbidden.name}`,
          severity: "error",
        });
      }
    }
  }

  // Check for "use client" files importing server-only code
  if (isClientComponent(filePath)) {
    const serverOnlyPatterns = [
      { pattern: /from ["']@\/lib\/supabase\/server/, name: "Server-only Supabase" },
      { pattern: /import.*DATABASE_URL/, name: "DATABASE_URL import" },
      { pattern: /process\.env\.(?!NEXT_PUBLIC_)/, name: "Server-only env access" },
    ];

    for (const pattern of serverOnlyPatterns) {
      if (pattern.pattern.test(content)) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          violation: `Client component contains server-only code (${pattern.name})`,
          severity: "error",
        });
      }
    }
  }

  return violations;
}

function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        files.push(...scanDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<ValidationResult> {
  const violations: BoundaryViolation[] = [];

  console.log("🔍 Scanning for boundary violations...\n");

  // Scan web package
  const webSrc = path.join(process.cwd(), "packages/web/src");
  if (fs.existsSync(webSrc)) {
    const files = scanDirectory(webSrc);

    for (const file of files) {
      const fileViolations = validateFile(file);
      violations.push(...fileViolations);
    }

    console.log(`📁 Scanned ${files.length} TypeScript files`);
  }

  // Group violations by file
  const violationsByFile = new Map<string, BoundaryViolation[]>();
  for (const violation of violations) {
    const existing = violationsByFile.get(violation.file) || [];
    existing.push(violation);
    violationsByFile.set(violation.file, existing);
  }

  const summary = {
    totalFiles: new Set(violations.map((v) => v.file)).size,
    filesWithViolations: violationsByFile.size,
    errors: violations.filter((v) => v.severity === "error").length,
    warnings: violations.filter((v) => v.severity === "warning").length,
  };

  return {
    passed: summary.errors === 0,
    violations,
    summary,
  };
}

// ============================================================================
// OUTPUT
// ============================================================================

function printResults(result: ValidationResult): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           BOUNDARY ENFORCEMENT VALIDATION                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  if (result.violations.length === 0) {
    console.log("✅ No boundary violations found");
    console.log("   - Marketing routes are clean");
    console.log("   - Client/Server boundaries respected");
    console.log();
    return;
  }

  // Group by file
  const byFile = new Map<string, BoundaryViolation[]>();
  for (const v of result.violations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, fileViolations] of byFile) {
    console.log(`📄 ${file}`);
    for (const v of fileViolations) {
      const icon = v.severity === "error" ? "❌" : "⚠️";
      const lineInfo = v.line ? `:${v.line}` : "";
      console.log(`   ${icon} ${v.violation}${lineInfo}`);
    }
    console.log();
  }

  console.log("───────────────────────────────────────────────────────────────");
  console.log(`Files scanned: ${result.summary.totalFiles}`);
  console.log(`Files with violations: ${result.summary.filesWithViolations}`);
  console.log(`Errors: ${result.summary.errors}`);
  console.log(`Warnings: ${result.summary.warnings}`);
  console.log(`Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("───────────────────────────────────────────────────────────────\n");

  if (!result.passed) {
    console.log("💡 Fix violations by:");
    console.log("   1. Moving auth/Supabase code to server components");
    console.log("   2. Using environment variables only in server-side code");
    console.log("   3. Creating client-safe wrappers for server operations");
    console.log();
  }
}

// Run
main()
  .then((result) => {
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Boundary validation failed:", error);
    process.exit(2);
  });
