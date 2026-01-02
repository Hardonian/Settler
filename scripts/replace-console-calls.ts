/**
 * Script to find and replace remaining console.* calls
 * 
 * This script helps identify any remaining console.* calls that should be replaced
 * with safeLogger for proper structured logging.
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function findConsoleCalls() {
  const files = await glob('packages/web/src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/__tests__/**'],
  });

  const consoleCalls: Array<{ file: string; line: number; content: string }> = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Match console.warn, console.error, console.log, console.info, console.debug
      if (/console\.(warn|error|log|info|debug)/.test(line)) {
        // Skip test files and node_modules
        if (!file.includes('__tests__') && !file.includes('node_modules')) {
          consoleCalls.push({
            file,
            line: index + 1,
            content: line.trim(),
          });
        }
      }
    });
  }

  if (consoleCalls.length > 0) {
    console.log(`Found ${consoleCalls.length} console.* calls:\n`);
    consoleCalls.forEach(({ file, line, content }) => {
      console.log(`${file}:${line}`);
      console.log(`  ${content}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ No console.* calls found (all replaced with safeLogger)');
    process.exit(0);
  }
}

findConsoleCalls().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
