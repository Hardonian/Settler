#!/usr/bin/env tsx
/**
 * Classification Fix Suggestions
 * 
 * Analyzes classification violations and suggests fixes.
 * 
 * Usage:
 *   pnpm classify:fix-suggestions
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface Violation {
  type: string;
  file: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

async function loadClassificationReport(): Promise<{ violations: Violation[] } | null> {
  try {
    const reportPath = path.join('artifacts', 'classification-report.json');
    const content = await fs.readFile(reportPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function suggestFix(violation: Violation): string[] {
  const suggestions: string[] = [];
  
  if (violation.type === 'secret_detected') {
    suggestions.push('🔴 CRITICAL: Remove actual secret value');
    suggestions.push('   - Replace with environment variable');
    suggestions.push('   - Use placeholder: STRIPE_SECRET_KEY=sk_test_...');
    suggestions.push('   - Never commit actual secrets');
  }
  
  if (violation.type === 'oss_imports_proprietary') {
    suggestions.push('🟡 HIGH: OSS package imports proprietary code');
    suggestions.push('   - Remove import from proprietary package');
    suggestions.push('   - Refactor to use OSS-compatible alternative');
    suggestions.push('   - Or move file to PLATFORM_PROPRIETARY package');
  }
  
  if (violation.message.includes('INTERNAL_BUSINESS')) {
    suggestions.push('🟡 HIGH: Business document in wrong location');
    suggestions.push('   - Move to: internal/business/');
    suggestions.push('   - Or: docs/internal/business/');
    suggestions.push('   - Never place in docs/public/ or packages/sdk/');
  }
  
  if (violation.message.includes('not in allowlist')) {
    suggestions.push('🟢 MEDIUM: File not in OSS_PUBLIC allowlist');
    suggestions.push('   - Move to appropriate OSS_PUBLIC path');
    suggestions.push('   - Or update classification rules if legitimate');
  }
  
  return suggestions;
}

async function main() {
  console.log('🔍 Analyzing classification violations...\n');
  
  const report = await loadClassificationReport();
  
  if (!report) {
    console.error('❌ Classification report not found. Run "pnpm classify" first.');
    process.exit(1);
  }
  
  if (report.violations.length === 0) {
    console.log('✅ No violations found!');
    process.exit(0);
  }
  
  console.log(`Found ${report.violations.length} violation(s):\n`);
  
  report.violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.severity.toUpperCase()}: ${violation.type}`);
    console.log(`   File: ${violation.file}`);
    console.log(`   Message: ${violation.message}`);
    console.log('');
    
    const suggestions = suggestFix(violation);
    if (suggestions.length > 0) {
      console.log('   💡 Suggested fixes:');
      suggestions.forEach(suggestion => {
        console.log(`   ${suggestion}`);
      });
      console.log('');
    }
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Next steps:');
  console.log('   1. Review violations above');
  console.log('   2. Apply suggested fixes');
  console.log('   3. Run "pnpm classify:strict" to verify');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
