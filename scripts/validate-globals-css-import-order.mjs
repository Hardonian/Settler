#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const entryCssFiles = [
  {
    path: 'packages/web/src/app/globals.css',
    requiredFirstImport: '@import "../../../../design-system/css-tokens.css";',
  },
  {
    path: 'packages/web/src/styles/responsive-text.css',
  },
];

function getFirstMeaningfulLine(lines) {
  return lines.find((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('*/')
    );
  });
}

function validateEntry(entry) {
  const fullPath = resolve(process.cwd(), entry.path);
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const firstMeaningfulLine = getFirstMeaningfulLine(lines);
  const importIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith('@import'));
  const tailwindIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith('@tailwind'));

  if (entry.requiredFirstImport && firstMeaningfulLine !== entry.requiredFirstImport) {
    throw new Error(
      `${entry.path}: expected first meaningful line to be ${entry.requiredFirstImport}, found ${firstMeaningfulLine ?? '<none>'}`
    );
  }

  if (tailwindIndexes.length > 0 && importIndexes.some(({ index }) => index > tailwindIndexes[0].index)) {
    throw new Error(`${entry.path}: @import rules must appear before @tailwind directives`);
  }
}

try {
  for (const entry of entryCssFiles) {
    validateEntry(entry);
  }
  console.log('✅ CSS entrypoint import-order check passed.');
} catch (error) {
  console.error('❌ CSS entrypoint import-order check failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
