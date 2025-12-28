#!/usr/bin/env tsx
/**
 * Comprehensive Code Quality Audit
 * 
 * Checks for:
 * - Security issues (hardcoded secrets, missing auth checks)
 * - Performance issues (N+1 queries, missing indexes)
 * - Code quality (unused code, missing error handling)
 * - Type safety (excessive 'any' usage)
 * - Best practices (proper logging, error handling)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  file?: string;
  line?: number;
  recommendation: string;
}

const results: AuditResult[] = [];

function addResult(result: AuditResult) {
  results.push(result);
}

function checkHardcodedSecrets() {
  console.log('🔍 Checking for hardcoded secrets...');
  
  const patterns = [
    /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"](sk_live_|sk_test_|pk_live_|pk_test_|whsec_|shpat_)[^'"]+['"]/gi,
    /(?:DATABASE_URL|STRIPE_SECRET|JWT_SECRET)\s*[:=]\s*['"][^'"]+['"]/gi,
  ];

  try {
    const files = execSync(
      'find packages -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v __tests__ | grep -v test',
      { encoding: 'utf-8' }
    ).trim().split('\n');

    for (const file of files) {
      if (!existsSync(file)) continue;
      
      const content = readFileSync(file, 'utf-8');
      
      // Skip test files and example files
      if (file.includes('test') || file.includes('example') || file.includes('mock')) {
        continue;
      }

      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const lines = content.substring(0, match.index || 0).split('\n');
          const lineNum = lines.length;
          
          // Check if it's a placeholder/example
          if (match[0].includes('your_') || match[0].includes('test_') || match[0].includes('...')) {
            continue;
          }
          
          addResult({
            category: 'Security',
            severity: 'critical',
            issue: `Potential hardcoded secret found: ${match[0].substring(0, 50)}...`,
            file,
            line: lineNum,
            recommendation: 'Use environment variables instead of hardcoded secrets',
          });
        }
      }
    }
  } catch (error) {
    console.warn('Could not check for hardcoded secrets:', error);
  }
}

function checkErrorHandling() {
  console.log('🔍 Checking error handling...');
  
  try {
    const files = execSync(
      'find packages/api/src packages/web/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v __tests__',
      { encoding: 'utf-8' }
    ).trim().split('\n');

    for (const file of files) {
      if (!existsSync(file)) continue;
      
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Check for empty catch blocks
      const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*\}/g;
      let match;
      while ((match = emptyCatchRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        addResult({
          category: 'Error Handling',
          severity: 'high',
          issue: 'Empty catch block found',
          file,
          line: lineNum,
          recommendation: 'Add proper error logging and handling in catch blocks',
        });
      }

      // Check for unhandled promise rejections
      const asyncFunctions = content.matchAll(/async\s+(?:function|\()/g);
      for (const match of asyncFunctions) {
        const funcStart = match.index || 0;
        const funcContent = content.substring(funcStart, funcStart + 500);
        
        if (!funcContent.includes('try') && funcContent.includes('await')) {
          const lineNum = content.substring(0, funcStart).split('\n').length;
          addResult({
            category: 'Error Handling',
            severity: 'medium',
            issue: 'Async function without try-catch block',
            file,
            line: lineNum,
            recommendation: 'Wrap await calls in try-catch blocks for proper error handling',
          });
        }
      }
    }
  } catch (error) {
    console.warn('Could not check error handling:', error);
  }
}

function checkConsoleUsage() {
  console.log('🔍 Checking for console.log usage...');
  
  try {
    const files = execSync(
      'grep -r "console\\.(log|error|warn|debug)" packages/api/src packages/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v dist | grep -v __tests__ | cut -d: -f1 | sort -u',
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    for (const file of files) {
      if (!existsSync(file)) continue;
      
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.match(/console\.(log|error|warn|debug)/)) {
          // Allow console usage in specific cases
          if (line.includes('JobScheduler') || line.includes('// Allow')) {
            return;
          }
          
          addResult({
            category: 'Code Quality',
            severity: 'low',
            issue: `console.${line.match(/console\.(\w+)/)?.[1]} usage found`,
            file,
            line: index + 1,
            recommendation: 'Use proper logger (logInfo, logError, etc.) instead of console methods',
          });
        }
      });
    }
  } catch (error) {
    console.warn('Could not check console usage:', error);
  }
}

function checkTypeSafety() {
  console.log('🔍 Checking type safety...');
  
  try {
    const files = execSync(
      'grep -r ": any" packages/api/src packages/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v dist | grep -v __tests__ | wc -l',
      { encoding: 'utf-8' }
    ).trim();

    const count = parseInt(files, 10);
    
    if (count > 100) {
      addResult({
        category: 'Type Safety',
        severity: 'medium',
        issue: `Found ${count} uses of 'any' type`,
        recommendation: 'Consider using proper types or unknown instead of any',
      });
    }
  } catch (error) {
    console.warn('Could not check type safety:', error);
  }
}

function checkDatabaseIndexes() {
  console.log('🔍 Checking database indexes...');
  
  try {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    if (!existsSync(schemaPath)) {
      return;
    }

    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Check for models with foreign keys but no indexes
    const models = schema.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/gs);
    
    for (const model of models) {
      const modelName = model[1];
      const modelContent = model[2];
      
      // Find foreign key fields
      const foreignKeys = modelContent.matchAll(/(\w+)\s+(\w+)\s+@relation/g);
      const indexes = modelContent.match(/@@index/);
      
      for (const fk of foreignKeys) {
        const fieldName = fk[1];
        if (!indexes && !modelContent.includes(`@@index([${fieldName}])`)) {
          addResult({
            category: 'Performance',
            severity: 'medium',
            issue: `Model ${modelName} has foreign key ${fieldName} without index`,
            file: 'prisma/schema.prisma',
            recommendation: `Add @@index([${fieldName}]) to improve query performance`,
          });
        }
      }
    }
  } catch (error) {
    console.warn('Could not check database indexes:', error);
  }
}

function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  try {
    const auditOutput = execSync('npm audit --json --audit-level=moderate 2>&1', { encoding: 'utf-8' });
    const audit = JSON.parse(auditOutput);
    
    if (audit.vulnerabilities && typeof audit.vulnerabilities === 'object') {
      const vulnCounts = Object.values(audit.vulnerabilities).reduce((acc: any, vuln: any) => {
        const severity = vuln.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});
      
      const critical = vulnCounts.critical || 0;
      const high = vulnCounts.high || 0;
      
      if (critical > 0 || high > 0) {
        addResult({
          category: 'Security',
          severity: critical > 0 ? 'critical' : 'high',
          issue: `Found ${critical} critical and ${high} high severity vulnerabilities`,
          recommendation: 'Run "npm audit fix" to resolve vulnerabilities. Review changes before committing.',
        });
      }
    }
  } catch (error: any) {
    // npm audit exits with code 1 when vulnerabilities are found
    if (error.status === 1 && error.output) {
      try {
        const auditOutput = error.output[1] || error.output.toString();
        const audit = JSON.parse(auditOutput);
        
        if (audit.vulnerabilities && typeof audit.vulnerabilities === 'object') {
          const vulnCounts = Object.values(audit.vulnerabilities).reduce((acc: any, vuln: any) => {
            const severity = vuln.severity || 'unknown';
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
          }, {});
          
          const critical = vulnCounts.critical || 0;
          const high = vulnCounts.high || 0;
          
          if (critical > 0 || high > 0) {
            addResult({
              category: 'Security',
              severity: critical > 0 ? 'critical' : 'high',
              issue: `Found ${critical} critical and ${high} high severity vulnerabilities`,
              recommendation: 'Run "npm audit fix" to resolve vulnerabilities. Review changes before committing.',
            });
          }
        }
      } catch (parseError) {
        console.warn('Could not parse npm audit output:', parseError);
      }
    } else {
      console.warn('Could not check dependencies:', error.message);
    }
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('CODE QUALITY AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  const byCategory: Record<string, AuditResult[]> = {};
  const bySeverity: Record<string, AuditResult[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
    bySeverity[result.severity].push(result);
  });

  console.log('Summary:');
  console.log(`  Critical: ${bySeverity.critical.length}`);
  console.log(`  High: ${bySeverity.high.length}`);
  console.log(`  Medium: ${bySeverity.medium.length}`);
  console.log(`  Low: ${bySeverity.low.length}`);
  console.log(`  Total: ${results.length}\n`);

  // Show critical and high severity issues first
  const criticalHigh = [...bySeverity.critical, ...bySeverity.high];
  if (criticalHigh.length > 0) {
    console.log('🔴 CRITICAL & HIGH SEVERITY ISSUES:');
    console.log('-'.repeat(80));
    criticalHigh.forEach((result, index) => {
      console.log(`\n${index + 1}. [${result.category}] ${result.issue}`);
      if (result.file) {
        console.log(`   File: ${result.file}${result.line ? `:${result.line}` : ''}`);
      }
      console.log(`   Recommendation: ${result.recommendation}`);
    });
    console.log('\n');
  }

  // Show by category
  Object.entries(byCategory).forEach(([category, issues]) => {
    console.log(`\n📁 ${category} (${issues.length} issues):`);
    console.log('-'.repeat(80));
    issues.slice(0, 10).forEach((result, index) => {
      console.log(`  ${index + 1}. [${result.severity.toUpperCase()}] ${result.issue}`);
      if (result.file) {
        console.log(`     ${result.file}${result.line ? `:${result.line}` : ''}`);
      }
    });
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more`);
    }
  });

  // Save to file
  const reportPath = join(process.cwd(), 'ops', 'reports', 'CODE_QUALITY_AUDIT.md');
  const reportContent = `# Code Quality Audit Report

Generated: ${new Date().toISOString()}

## Summary

- Critical: ${bySeverity.critical.length}
- High: ${bySeverity.high.length}
- Medium: ${bySeverity.medium.length}
- Low: ${bySeverity.low.length}
- Total: ${results.length}

## Issues

${results.map((r, i) => `
### ${i + 1}. [${r.severity.toUpperCase()}] ${r.issue}

**Category:** ${r.category}
${r.file ? `**File:** ${r.file}${r.line ? `:${r.line}` : ''}` : ''}
**Recommendation:** ${r.recommendation}
`).join('\n')}
`;

  require('fs').mkdirSync(join(process.cwd(), 'ops', 'reports'), { recursive: true });
  require('fs').writeFileSync(reportPath, reportContent);
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Exit with error code if critical issues found
  if (bySeverity.critical.length > 0) {
    process.exit(1);
  }
}

// Run all checks
async function main() {
  console.log('Starting comprehensive code quality audit...\n');
  
  checkHardcodedSecrets();
  checkErrorHandling();
  checkConsoleUsage();
  checkTypeSafety();
  checkDatabaseIndexes();
  checkDependencies();
  
  generateReport();
}

main().catch(console.error);
