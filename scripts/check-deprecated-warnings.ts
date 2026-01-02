/**
 * Check for Deprecated Warnings
 * 
 * Scans codebase for deprecated APIs, assets, or flags that might cause warnings.
 */

import * as fs from 'fs';
import { glob } from 'glob';

interface DeprecatedWarning {
  file: string;
  line: number;
  content: string;
  type: 'deprecated_api' | 'deprecated_import' | 'deprecated_flag' | 'console_call';
}

async function checkDeprecated() {
  const warnings: DeprecatedWarning[] = [];
  
  const files = await glob('packages/web/src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/__tests__/**'],
  });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for deprecated imports/APIs
      if (/@deprecated|deprecated|DEPRECATED/.test(line) && !line.includes('@deprecated Use')) {
        warnings.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'deprecated_api',
        });
      }

      // Check for console.* calls (should use safeLogger)
      if (/console\.(warn|error|log|info|debug)/.test(line)) {
        warnings.push({
          file,
          line: index + 1,
          content: line.trim(),
          type: 'console_call',
        });
      }

      // Check for throw statements (should return errors gracefully)
      if (/throw\s+(new\s+)?Error/.test(line) && !file.includes('__tests__')) {
        // Allow throws in test files and some specific cases
        if (!line.includes('// ALLOWED') && !line.includes('test')) {
          warnings.push({
            file,
            line: index + 1,
            content: line.trim(),
            type: 'deprecated_api',
          });
        }
      }
    });
  }

  if (warnings.length > 0) {
    console.log(`Found ${warnings.length} potential deprecated warnings:\n`);
    
    const byType = warnings.reduce((acc, w) => {
      if (!acc[w.type]) acc[w.type] = [];
      acc[w.type].push(w);
      return acc;
    }, {} as Record<string, DeprecatedWarning[]>);

    for (const [type, items] of Object.entries(byType)) {
      console.log(`\n${type.toUpperCase()} (${items.length}):`);
      items.forEach(({ file, line, content }) => {
        console.log(`  ${file}:${line}`);
        console.log(`    ${content.substring(0, 80)}...`);
      });
    }

    process.exit(1);
  } else {
    console.log('✅ No deprecated warnings found');
    process.exit(0);
  }
}

checkDeprecated().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
