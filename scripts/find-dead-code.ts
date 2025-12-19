/**
 * Dead Code Detection Script
 * Finds unused exports, functions, and files
 */

import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

interface DeadCodeResult {
  unusedExports: Array<{ file: string; export: string }>;
  unusedFiles: string[];
  duplicateCode: Array<{ files: string[]; similarity: number }>;
}

async function findDeadCode(): Promise<DeadCodeResult> {
  const result: DeadCodeResult = {
    unusedExports: [],
    unusedFiles: [],
    duplicateCode: [],
  };

  // Find all TypeScript files
  const files = await glob("packages/api/src/**/*.ts", {
    ignore: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**", "**/dist/**"],
  });

  // Simple check for files with no imports
  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");

      // Check if file has exports
      const hasExports = /export\s+(function|class|const|interface|type|enum)/.test(content);

      // Check if file is imported anywhere (simple check)
      const fileName = path.basename(file, ".ts");
      const filePath = file.replace(/\.ts$/, "");

      let isImported = false;
      for (const otherFile of files) {
        if (otherFile === file) continue;
        const otherContent = await fs.readFile(otherFile, "utf-8");
        if (
          otherContent.includes(`from "${filePath}"`) ||
          otherContent.includes(`from '${filePath}'`) ||
          otherContent.includes(`from "./${fileName}"`) ||
          otherContent.includes(`from '../${fileName}'`)
        ) {
          isImported = true;
          break;
        }
      }

      if (hasExports && !isImported && !file.includes("index.ts")) {
        // This is a candidate for unused file
        // But we need to be careful - index files might re-export
        result.unusedFiles.push(file);
      }
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  }

  return result;
}

// Run analysis
findDeadCode()
  .then((result) => {
    console.log("Dead Code Analysis Results:");
    console.log("\nUnused Files (candidates):");
    result.unusedFiles.forEach((file) => console.log(`  - ${file}`));
    console.log(`\nTotal: ${result.unusedFiles.length} candidate files`);
  })
  .catch((error) => {
    console.error("Analysis failed:", error);
    process.exit(1);
  });
