#!/usr/bin/env tsx
/**
 * Error Monitoring Script
 * 
 * Monitors error logs and provides insights on common issues.
 * Can be integrated into CI/CD or run manually.
 */

interface ErrorPattern {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix?: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /SUPABASE.*not.*configured|Missing.*SUPABASE/i,
    severity: 'critical',
    description: 'Supabase configuration missing',
    fix: 'Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Vercel',
  },
  {
    pattern: /404.*docs|route.*not.*found.*docs/i,
    severity: 'critical',
    description: 'Docs route returning 404',
    fix: 'Verify [slug] route exclusion is working correctly',
  },
  {
    pattern: /500.*console|Internal.*Server.*Error.*console/i,
    severity: 'critical',
    description: 'Console route returning 500',
    fix: 'Check Supabase authentication configuration and error handling',
  },
  {
    pattern: /JWT.*secret|JWT_SECRET.*missing/i,
    severity: 'high',
    description: 'JWT secret missing or invalid',
    fix: 'Set JWT_SECRET (must be 32+ characters) in Vercel',
  },
  {
    pattern: /Stripe.*key.*missing|STRIPE.*not.*configured/i,
    severity: 'high',
    description: 'Stripe configuration missing',
    fix: 'Set STRIPE_SECRET_KEY in Vercel for billing features',
  },
  {
    pattern: /Resend.*key.*missing|RESEND.*not.*configured/i,
    severity: 'medium',
    description: 'Resend email configuration missing',
    fix: 'Set RESEND_API_KEY in Vercel for email features',
  },
  {
    pattern: /Redis.*connection.*failed|REDIS.*not.*configured/i,
    severity: 'medium',
    description: 'Redis connection failed',
    fix: 'Set REDIS_URL or UPSTASH_REDIS_REST_URL in Vercel (optional)',
  },
  {
    pattern: /tenant.*context.*failed|getTenantContext.*error/i,
    severity: 'high',
    description: 'Tenant context resolution failed',
    fix: 'Check Supabase connection and tenant database tables',
  },
];

function analyzeError(errorMessage: string): ErrorPattern[] {
  const matches: ErrorPattern[] = [];
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      matches.push(pattern);
    }
  }
  
  return matches;
}

function printAnalysis(matches: ErrorPattern[]) {
  if (matches.length === 0) {
    console.log('✅ No known error patterns detected');
    return;
  }
  
  const critical = matches.filter(m => m.severity === 'critical');
  const high = matches.filter(m => m.severity === 'high');
  const medium = matches.filter(m => m.severity === 'medium');
  const low = matches.filter(m => m.severity === 'low');
  
  console.log('\n🔍 Error Analysis\n');
  console.log('='.repeat(60));
  
  function printCategory(category: ErrorPattern[], title: string, icon: string) {
    if (category.length === 0) return;
    
    console.log(`\n${icon} ${title}`);
    console.log('-'.repeat(60));
    
    for (const match of category) {
      console.log(`\n${match.description}`);
      if (match.fix) {
        console.log(`   Fix: ${match.fix}`);
      }
    }
  }
  
  printCategory(critical, 'CRITICAL ISSUES', '🔴');
  printCategory(high, 'HIGH PRIORITY ISSUES', '🟠');
  printCategory(medium, 'MEDIUM PRIORITY ISSUES', '🟡');
  printCategory(low, 'LOW PRIORITY ISSUES', '🟢');
  
  console.log('\n' + '='.repeat(60));
}

// Example usage - can be extended to read from logs
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: tsx scripts/monitor-errors.ts <error-message>');
    console.log('Example: tsx scripts/monitor-errors.ts "SUPABASE_URL is not configured"');
    process.exit(1);
  }
  
  const errorMessage = args.join(' ');
  const matches = analyzeError(errorMessage);
  
  console.log(`\nAnalyzing error: "${errorMessage}"\n`);
  printAnalysis(matches);
  
  if (matches.some(m => m.severity === 'critical')) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzeError, ERROR_PATTERNS };
