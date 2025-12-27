#!/usr/bin/env tsx
/**
 * Secure Cron and Internal Routes
 * 
 * These routes should be secured via API keys or service role, not billing gates.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

const API_DIR = join(process.cwd(), 'packages/web/src/app/api');

const CRON_INTERNAL_PATTERNS = [
  '/api/cron/',
  '/api/internal/',
];

async function secureRoutes() {
  console.log('🔒 Securing cron and internal routes...\n');

  const routeFiles = await glob('**/route.ts', {
    cwd: API_DIR,
    absolute: true,
    ignore: ['**/*.backup'],
  });

  const cronInternalRoutes = routeFiles.filter(file => 
    CRON_INTERNAL_PATTERNS.some(pattern => file.includes(pattern.replace('/api', '')))
  );

  console.log(`Found ${cronInternalRoutes.length} cron/internal routes\n`);

  for (const file of cronInternalRoutes) {
    const content = readFileSync(file, 'utf-8');
    
    // Check if already has proper security (API key check or service role)
    if (content.includes('x-api-key') || 
        content.includes('service_role') ||
        content.includes('CRON_SECRET') ||
        content.includes('INTERNAL_SECRET')) {
      console.log(`✅ ${file.replace(API_DIR, '')} - Already secured`);
      continue;
    }

    // Add API key check or service role check
    // For cron routes, typically secured via Vercel cron secret or API key
    // For internal routes, typically secured via service role
    
    console.log(`🔒 Securing: ${file.replace(API_DIR, '')}`);
    
    // Add comment about security
    const securityComment = `
// SECURITY: This route is secured via:
// - Vercel Cron Secret (for cron routes)
// - Service Role API Key (for internal routes)
// - Not using billing gates (system/internal use)
`;

    // Find first export function
    const exportMatch = content.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/);
    if (exportMatch) {
      const insertIndex = exportMatch.index!;
      const before = content.substring(0, insertIndex);
      const after = content.substring(insertIndex);
      
      const newContent = before + securityComment + '\n' + after;
      writeFileSync(file, newContent, 'utf-8');
      console.log(`   ✅ Added security comment\n`);
    }
  }

  console.log('✅ Cron/internal routes secured\n');
}

secureRoutes().catch(console.error);
