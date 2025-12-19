/**
 * Phase 5 Analysis Script
 * Analyzes codebase for dead code, security issues, performance, and robustness
 */

import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

interface AnalysisResult {
  deadCode: Array<{ file: string; type: string; item: string; reason: string }>;
  securityIssues: Array<{ file: string; line: number; issue: string; severity: string }>;
  performanceIssues: Array<{ file: string; issue: string; suggestion: string }>;
  robustnessIssues: Array<{ file: string; issue: string; suggestion: string }>;
  todos: Array<{ file: string; line: number; todo: string }>;
}

async function analyzeCodebase(): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    deadCode: [],
    securityIssues: [],
    performanceIssues: [],
    robustnessIssues: [],
    todos: [],
  };

  // Find all TypeScript files
  const files = await glob("packages/api/src/**/*.ts", {
    ignore: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
  });

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n");

      // Check for TODOs
      lines.forEach((line, index) => {
        if (line.includes("TODO") || line.includes("FIXME") || line.includes("XXX")) {
          result.todos.push({
            file,
            line: index + 1,
            todo: line.trim(),
          });
        }
      });

      // Check for security issues
      lines.forEach((line, index) => {
        // SQL injection risks
        if (line.includes("query(") && !line.includes("$") && line.includes("+")) {
          result.securityIssues.push({
            file,
            line: index + 1,
            issue: "Potential SQL injection - string concatenation in query",
            severity: "high",
          });
        }

        // Hardcoded secrets
        if (
          line.match(/password\s*=\s*["'][^"']+["']/i) ||
          line.match(/api[_-]?key\s*=\s*["'][^"']+["']/i) ||
          line.match(/secret\s*=\s*["'][^"']+["']/i)
        ) {
          result.securityIssues.push({
            file,
            line: index + 1,
            issue: "Potential hardcoded secret",
            severity: "critical",
          });
        }

        // Missing input validation
        if (
          line.includes("req.body") &&
          !content.includes("validate") &&
          !content.includes("zod") &&
          !content.includes("schema")
        ) {
          result.securityIssues.push({
            file,
            line: index + 1,
            issue: "Missing input validation",
            severity: "medium",
          });
        }
      });

      // Check for performance issues
      lines.forEach((line, index) => {
        // N+1 query patterns
        if (line.includes("await query(") && content.match(/for\s*\(.*await query/g)) {
          result.performanceIssues.push({
            file,
            issue: "Potential N+1 query pattern",
            suggestion: "Use batch queries or JOINs",
          });
        }

        // Missing pagination
        if (line.includes("SELECT") && !line.includes("LIMIT") && !line.includes("OFFSET")) {
          result.performanceIssues.push({
            file,
            issue: "Query may return large result set without pagination",
            suggestion: "Add LIMIT and pagination",
          });
        }
      });

      // Check for robustness issues
      lines.forEach((line, index) => {
        // Missing error handling
        if (line.includes("await") && !content.includes("try") && !content.includes("catch")) {
          result.robustnessIssues.push({
            file,
            issue: "Async operation without error handling",
            suggestion: "Add try-catch block",
          });
        }

        // Missing null checks
        if (
          line.includes(".") &&
          !line.includes("?.") &&
          !line.includes("if") &&
          !line.includes("&&")
        ) {
          result.robustnessIssues.push({
            file,
            issue: "Potential null/undefined access",
            suggestion: "Add null checks or optional chaining",
          });
        }
      });
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  }

  return result;
}

// Run analysis
analyzeCodebase()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("Analysis failed:", error);
    process.exit(1);
  });
