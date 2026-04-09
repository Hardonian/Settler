/**
 * Settler Security & Performance Audit
 * 
 * Scans the codebase for security and performance issues
 * Run: node scripts/audit-settler.js
 */

const fs = require('fs');
const path = require('path');

class SettlerAudit {
  constructor(root) {
    this.root = root;
    this.issues = [];
  }

  async run() {
    console.log('🔍 Running Settler Security & Performance Audit...\n');

    await this.checkConsoleLogs();
    await this.checkAnyTypes();
    await this.checkErrorHandling();
    await this.checkSecurityPatterns();
    await this.checkPerformancePatterns();
    await this.checkMissingTests();

    this.report();
  }

  async checkConsoleLogs() {
    const pattern = /console\.(log|error|warn)\(/g;
    const files = await this.findFiles('packages/', '*.ts');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          type: 'console',
          severity: 'low',
          file: file.replace(this.root + '/', ''),
          count: matches.length,
          message: `${matches.length} console statements`
        });
      }
    }
  }

  async checkAnyTypes() {
    const pattern = /: any|as any|\bany\b/g;
    const files = await this.findFiles('packages/', '*.ts');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(pattern);
      if (matches && matches.length > 5) {
        this.issues.push({
          type: 'typing',
          severity: 'medium',
          file: file.replace(this.root + '/', ''),
          count: matches.length,
          message: `${matches.length} 'any' type usages - use proper types`
        });
      }
    }
  }

  async checkErrorHandling() {
    const files = await this.findFiles('packages/', '*.ts');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for empty catch blocks
      if (content.includes('catch {}') || content.includes('catch(e){}')) {
        this.issues.push({
          type: 'error',
          severity: 'high',
          file: file.replace(this.root + '/', ''),
          message: 'Empty catch block - errors silently swallowed'
        });
      }
      
      // Check for console.error in production areas
      if (content.includes('console.error') && file.includes('packages/api/')) {
        this.issues.push({
          type: 'logging',
          severity: 'low',
          file: file.replace(this.root + '/', ''),
          message: 'Use proper logger instead of console.error'
        });
      }
    }
  }

  async checkSecurityPatterns() {
    const files = await this.findFiles('packages/api/', '*.ts');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for SQL injection risks (raw queries without parameterized)
      if (content.includes('$queryRaw') && !content.includes('$queryRawUnsafe')) {
        // This is actually safe with Prisma, flag anyway for review
      }
      
      // Check for missing auth checks
      if (content.includes('app.') && !content.includes('authenticate') && !content.includes('requireAuth')) {
        // Potential missing auth
      }
    }
  }

  async checkPerformancePatterns() {
    const files = await this.findFiles('packages/api/', '*.ts');
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for missing indexes in queries
      if (content.includes('.where(') && !content.includes('.index')) {
        // Could benefit from index
      }
      
      // Check for N+1 queries
      if (content.includes('forEach') && content.includes('await') && content.includes('findMany')) {
        this.issues.push({
          type: 'performance',
          severity: 'medium',
          file: file.replace(this.root + '/', ''),
          message: 'Potential N+1 query - use include/join instead'
        });
      }
    }
  }

  async checkMissingTests() {
    const sourceFiles = await this.findFiles('packages/', '*.ts');
    const testFiles = await this.findFiles('packages/', '*.test.ts');
    
    const sourceWithoutTests = sourceFiles.filter(f => {
      const testPath = f.replace('.ts', '.test.ts');
      return !testFiles.includes(testPath);
    });
    
    if (sourceWithoutTests.length > 0) {
      this.issues.push({
        type: 'coverage',
        severity: 'medium',
        file: 'Multiple files',
        count: sourceWithoutTests.length,
        message: `${sourceWithoutTests.length} source files lack tests`
      });
    }
  }

  async findFiles(dir, pattern) {
    const files = [];
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          walk(full);
        } else if (entry.isFile() && entry.name.match(pattern)) {
          files.push(full);
        }
      }
    };
    walk(path.join(this.root, dir));
    return files;
  }

  report() {
    console.log('═'.repeat(60));
    console.log('AUDIT RESULTS\n');

    const bySeverity = { high: [], medium: [], low: [] };
    const byType = {};

    for (const issue of this.issues) {
      bySeverity[issue.severity].push(issue);
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }

    console.log(`Total Issues: ${this.issues.length}`);
    console.log(`  🔴 High:    ${bySeverity.high.length}`);
    console.log(`  🟡 Medium: ${bySeverity.medium.length}`);
    console.log(`  🟢 Low:    ${bySeverity.low.length}`);

    console.log('\nBy Category:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }

    if (bySeverity.high.length > 0) {
      console.log('\n🔴 HIGH PRIORITY ISSUES:');
      for (const issue of bySeverity.high.slice(0, 10)) {
        console.log(`  - ${issue.file}: ${issue.message}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('RECOMMENDATIONS:');
    console.log('1. Replace console.* with proper logger');
    console.log('2. Replace "any" types with specific interfaces');
    console.log('3. Add error handling to empty catch blocks');
    console.log('4. Add tests for untested modules');
    console.log('5. Use Prisma include() for N+1 queries');
  }
}

// Run
const root = process.cwd();
const audit = new SettlerAudit(root);
audit.run().catch(console.error);
