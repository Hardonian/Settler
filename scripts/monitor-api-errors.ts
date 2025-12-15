#!/usr/bin/env tsx
/**
 * API Error Monitoring Script
 * 
 * Monitors API routes for errors and generates reports.
 * Can be run as a cron job or manually.
 * 
 * Usage: tsx scripts/monitor-api-errors.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ErrorLog {
  timestamp: string;
  route: string;
  method: string;
  status: number;
  error: string;
  userId?: string;
}

/**
 * Check for recent errors in logs or database
 */
async function checkApiErrors(): Promise<ErrorLog[]> {
  const errors: ErrorLog[] = [];

  // In production, this would query your error tracking service
  // For now, we'll check for common error patterns

  // Check if Sentry is configured
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    console.log('Sentry configured - errors should be tracked there');
  }

  // Check for error log files (if using file-based logging)
  const errorLogPath = join(process.cwd(), 'logs', 'errors.json');
  if (existsSync(errorLogPath)) {
    try {
      const logContent = readFileSync(errorLogPath, 'utf-8');
      const logs = JSON.parse(logContent) as ErrorLog[];
      errors.push(...logs);
    } catch (error) {
      console.warn('Failed to read error log file:', error);
    }
  }

  return errors;
}

/**
 * Generate error report
 */
function generateReport(errors: ErrorLog[]): void {
  if (errors.length === 0) {
    console.log('✅ No API errors detected');
    return;
  }

  console.log(`\n⚠️  Found ${errors.length} error(s):\n`);

  // Group by route
  const errorsByRoute = errors.reduce((acc, error) => {
    const key = `${error.method} ${error.route}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(error);
    return acc;
  }, {} as Record<string, ErrorLog[]>);

  // Report by route
  for (const [route, routeErrors] of Object.entries(errorsByRoute)) {
    console.log(`  ${route}: ${routeErrors.length} error(s)`);
    const recentErrors = routeErrors.slice(0, 3);
    recentErrors.forEach((error) => {
      console.log(`    - [${error.timestamp}] ${error.error.substring(0, 100)}`);
    });
    if (routeErrors.length > 3) {
      console.log(`    ... and ${routeErrors.length - 3} more`);
    }
  }

  // Check for 500 errors specifically
  const serverErrors = errors.filter((e) => e.status >= 500);
  if (serverErrors.length > 0) {
    console.error(`\n❌ CRITICAL: ${serverErrors.length} server error(s) (5xx) detected`);
    console.error('   These should be investigated immediately');
  }

  // Check for auth errors
  const authErrors = errors.filter((e) => e.status === 401 || e.status === 403);
  if (authErrors.length > 0) {
    console.warn(`\n⚠️  ${authErrors.length} authentication error(s) detected`);
  }
}

async function main() {
  console.log('🔍 Monitoring API errors...\n');

  const errors = await checkApiErrors();
  generateReport(errors);

  // Exit with error code if critical errors found
  const criticalErrors = errors.filter((e) => e.status >= 500);
  process.exit(criticalErrors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error during error monitoring:', error);
  process.exit(1);
});
