#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();

const listResult = spawnSync('git', ['ls-files', '-z'], {
  cwd: rootDir,
  encoding: 'utf8',
});

if (listResult.status !== 0) {
  const stderr = listResult.stderr?.trim() || 'Unknown git ls-files error';
  console.error(`❌ Unable to list tracked files: ${stderr}`);
  process.exit(1);
}

const files = (listResult.stdout || '').split('\0').filter(Boolean);
const markerPattern = /^(<{7}|={7}|>{7})(?:\s.*)?$/m;
const violations = [];

for (const relativePath of files) {
  const absolutePath = path.join(rootDir, relativePath);

  let contents;
  try {
    contents = fs.readFileSync(absolutePath, 'utf8');
  } catch {
    continue;
  }

  // Skip likely binary content.
  if (contents.includes('\u0000')) {
    continue;
  }

  if (!markerPattern.test(contents)) {
    continue;
  }

  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (/^(<{7}|={7}|>{7})(?:\s.*)?$/.test(lines[i] || '')) {
      violations.push(`${relativePath}:${i + 1}: ${lines[i]}`);
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Merge conflict markers detected in tracked files:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log('✅ No unresolved merge conflict markers found.');
