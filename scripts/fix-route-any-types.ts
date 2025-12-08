/**
 * Script to batch-fix all `any` types in route error handlers
 * This script identifies and suggests fixes for remaining `any` types
 */

import * as fs from 'fs';
import * as path from 'path';

const ROUTES_DIR = path.join(__dirname, '../packages/api/src/routes');

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixAnyTypes(content: string): { content: string; fixes: number } {
  let fixes = 0;
  let newContent = content;

  // Check if handleRouteError is imported
  const hasErrorHandlerImport = newContent.includes('handleRouteError');
  const needsImport = newContent.includes('catch (error: any)') || newContent.includes('catch(error: any)');

  // Add import if needed
  if (needsImport && !hasErrorHandlerImport) {
    // Find the last import statement
    const importMatch = newContent.match(/import.*from.*["']/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = newContent.lastIndexOf(lastImport);
      const endOfLine = newContent.indexOf('\n', lastImportIndex);
      newContent = newContent.slice(0, endOfLine) + '\nimport { handleRouteError } from "../utils/error-handler";' + newContent.slice(endOfLine);
      fixes++;
    }
  }

  // Replace catch (error: any) patterns
  const catchAnyPattern = /catch\s*\(\s*error\s*:\s*any\s*\)/g;
  const matches = newContent.match(catchAnyPattern);
  if (matches) {
    newContent = newContent.replace(catchAnyPattern, 'catch (error: unknown)');
    fixes += matches.length;
  }

  // Replace err?: any in callbacks
  const errAnyPattern = /err\?\s*:\s*any/g;
  const errMatches = newContent.match(errAnyPattern);
  if (errMatches) {
    newContent = newContent.replace(errAnyPattern, 'err?: unknown');
    fixes += errMatches.length;
  }

  return { content: newContent, fixes };
}

function main() {
  const routeFiles = findRouteFiles(ROUTES_DIR);
  let totalFixes = 0;

  console.log(`Found ${routeFiles.length} route files to check`);

  for (const filePath of routeFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { content: newContent, fixes } = fixAnyTypes(content);

      if (fixes > 0) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Fixed ${fixes} issue(s) in ${filePath}`);
        totalFixes += fixes;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log(`\nTotal fixes: ${totalFixes}`);
}

if (require.main === module) {
  main();
}

export { fixAnyTypes, findRouteFiles };
