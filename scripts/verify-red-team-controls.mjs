#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function assertFile(path) {
  if (!existsSync(resolve(root, path))) {
    throw new Error(`Missing required file: ${path}`);
  }
}

function assertContains(path, needle, description) {
  const content = readFileSync(resolve(root, path), 'utf8');
  if (!content.includes(needle)) {
    throw new Error(`Missing ${description} in ${path}`);
  }
}

try {
  assertFile('supabase/migrations/20260218000000_red_team_security_controls.sql');
  assertContains(
    'packages/web/src/app/api/console/usage/export/route.ts',
    'X-Settler-Export-Signature',
    'signed export header enforcement'
  );
  assertContains(
    'packages/web/src/lib/middleware/api-security.ts',
    'X-Privileged-Session-Record-Id',
    'privileged session record header'
  );
  assertContains(
    'packages/web/src/lib/ai/advisory-policy.ts',
    'requiresHumanApprovalForFinancialPosting',
    'AI advisory human approval policy'
  );

  console.log('✅ Red-team control verification passed.');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ Red-team control verification failed: ${message}`);
  process.exit(1);
}
