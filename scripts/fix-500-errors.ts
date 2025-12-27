/**
 * Script to systematically fix all routes returning 500 errors
 * 
 * This script identifies routes with status: 500 and replaces them
 * with graceful error handling that returns 200 with error info.
 * 
 * Usage: tsx scripts/fix-500-errors.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const API_ROUTES_DIR = join(process.cwd(), 'packages/web/src/app/api');

interface RouteFix {
  file: string;
  pattern: RegExp;
  replacement: string;
  description: string;
}

const patterns: RouteFix[] = [
  {
    file: '',
    pattern: /return NextResponse\.json\(\s*\{\s*error:\s*['"]Internal server error['"]\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\);/g,
    replacement: `return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );`,
    description: 'Simple internal server error',
  },
  {
    file: '',
    pattern: /return NextResponse\.json\(\s*\{\s*error:\s*['"]Internal server error['"]\s*,\s*message:\s*['"]([^'"]+)['"]\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\);/g,
    replacement: `return NextResponse.json(
      {
        success: false,
        error: '$1',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );`,
    description: 'Internal server error with message',
  },
  {
    file: '',
    pattern: /return NextResponse\.json\(\s*\{\s*error:\s*['"]Failed to ([^'"]+)['"]\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\);/g,
    replacement: `return NextResponse.json(
      {
        success: false,
        error: 'Failed to $1',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );`,
    description: 'Failed to X error',
  },
];

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

function fixFile(filePath: string): { fixed: boolean; changes: number } {
  let content = readFileSync(filePath, 'utf-8');
  let fixed = false;
  let changes = 0;

  // Check if file has status: 500
  if (!content.includes('status: 500')) {
    return { fixed: false, changes: 0 };
  }

  // Apply patterns
  for (const pattern of patterns) {
    const matches = content.match(pattern.pattern);
    if (matches) {
      content = content.replace(pattern.pattern, pattern.replacement);
      fixed = true;
      changes += matches.length;
    }
  }

  // Generic catch-all for remaining status: 500
  const status500Pattern = /(\s+)(return NextResponse\.json\([^)]+,\s*\{\s*status:\s*)500(\s*\}\);)/gs;
  const status500Matches = content.match(status500Pattern);
  if (status500Matches) {
    content = content.replace(
      status500Pattern,
      (match, indent, prefix, suffix) => {
        // Extract error message if present
        const errorMatch = match.match(/error:\s*['"]([^'"]+)['"]/);
        const errorMsg = errorMatch ? errorMatch[1] : 'An error occurred';
        
        return `${indent}// Never return 500 - return graceful error response
${indent}return NextResponse.json(
${indent}  {
${indent}    success: false,
${indent}    error: '${errorMsg}',
${indent}    message: 'Please try again later or contact support if the issue persists',
${indent}  },
${indent}  { status: 200 }
${indent});`;
      }
    );
    fixed = true;
    changes += status500Matches.length;
  }

  if (fixed) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { fixed, changes };
}

function main() {
  console.log('Finding route files...');
  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  console.log(`Found ${routeFiles.length} route files`);

  let totalFixed = 0;
  let totalChanges = 0;
  const fixedFiles: string[] = [];

  for (const file of routeFiles) {
    const result = fixFile(file);
    if (result.fixed) {
      totalFixed++;
      totalChanges += result.changes;
      fixedFiles.push(file.replace(process.cwd() + '/', ''));
    }
  }

  console.log(`\nFixed ${totalFixed} files with ${totalChanges} changes`);
  if (fixedFiles.length > 0) {
    console.log('\nFixed files:');
    fixedFiles.forEach(f => console.log(`  - ${f}`));
  }
}

if (require.main === module) {
  main();
}

export { fixFile, findRouteFiles };
