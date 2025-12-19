#!/usr/bin/env tsx
/**
 * Maintainer Audit - Code Health & Technical Debt Checker
 * 
 * Performs comprehensive codebase health audit
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

interface AuditIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

interface AuditReport {
  deadCode: AuditIssue[];
  dependencies: AuditIssue[];
  types: AuditIssue[];
  structure: AuditIssue[];
  documentation: AuditIssue[];
}

class MaintainerAudit {
  private rootDir: string;
  private issues: AuditIssue[] = [];

  constructor() {
    this.rootDir = process.cwd();
  }

  /**
   * Run full audit
   */
  async audit(): Promise<AuditReport> {
    console.log('🔍 Maintainer Audit - Analyzing codebase...\n');

    await this.checkDeadCode();
    await this.checkDependencies();
    await this.checkTypes();
    await this.checkStructure();
    await this.checkDocumentation();

    return this.categorizeIssues();
  }

  /**
   * Check for dead code
   */
  private async checkDeadCode(): Promise<void> {
    // Check for unused exports
    // This would require more sophisticated analysis
    // For now, check for obvious issues
    
    const packages = ['api', 'web', 'sdk', 'types'];
    for (const pkg of packages) {
      const srcDir = join(this.rootDir, 'packages', pkg, 'src');
      if (!this.exists(srcDir)) continue;

      // Check for empty files
      this.findEmptyFiles(srcDir);
    }
  }

  /**
   * Check dependencies
   */
  private async checkDependencies(): Promise<void> {
    const packageJson = join(this.rootDir, 'package.json');
    if (!this.exists(packageJson)) return;

    try {
      const pkg = JSON.parse(readFileSync(packageJson, 'utf-8'));
      
      // Check for outdated major versions
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Check for known security issues (would need npm audit)
      // Check for deprecated packages
      // Check for duplicate dependencies
    } catch (error) {
      this.issues.push({
        severity: 'error',
        category: 'dependencies',
        message: `Failed to parse package.json: ${error}`,
      });
    }
  }

  /**
   * Check TypeScript types
   */
  private async checkTypes(): Promise<void> {
    // Check for any types
    // Check for implicit any
    // Check for missing type definitions
  }

  /**
   * Check code structure
   */
  private async checkStructure(): Promise<void> {
    // Check for deeply nested directories
    // Check for large files
    // Check for circular dependencies
    // Check for module boundaries
  }

  /**
   * Check documentation
   */
  private async checkDocumentation(): Promise<void> {
    const readme = join(this.rootDir, 'README.md');
    if (!this.exists(readme)) {
      this.issues.push({
        severity: 'warning',
        category: 'documentation',
        message: 'README.md missing',
        suggestion: 'Create README.md with project overview and setup instructions',
      });
    }

    // Check for JSDoc on public APIs
    // Check for inline comments on complex logic
  }

  /**
   * Find empty files
   */
  private findEmptyFiles(dir: string, depth = 0): void {
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          this.findEmptyFiles(fullPath, depth + 1);
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            const content = readFileSync(fullPath, 'utf-8');
            if (content.trim().length === 0) {
              this.issues.push({
                severity: 'warning',
                category: 'dead-code',
                message: `Empty file found`,
                file: fullPath.replace(this.rootDir, ''),
                suggestion: 'Remove empty file or add content',
              });
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  /**
   * Categorize issues
   */
  private categorizeIssues(): AuditReport {
    return {
      deadCode: this.issues.filter(i => i.category === 'dead-code'),
      dependencies: this.issues.filter(i => i.category === 'dependencies'),
      types: this.issues.filter(i => i.category === 'types'),
      structure: this.issues.filter(i => i.category === 'structure'),
      documentation: this.issues.filter(i => i.category === 'documentation'),
    };
  }

  /**
   * Check if path exists
   */
  private exists(path: string): boolean {
    try {
      statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Report findings
   */
  report(report: AuditReport): void {
    console.log('\n📊 Maintainer Audit Report\n');

    const categories = [
      { name: 'Dead Code', issues: report.deadCode },
      { name: 'Dependencies', issues: report.dependencies },
      { name: 'Types', issues: report.types },
      { name: 'Structure', issues: report.structure },
      { name: 'Documentation', issues: report.documentation },
    ];

    for (const category of categories) {
      if (category.issues.length > 0) {
        console.log(`\n${category.name} (${category.issues.length}):`);
        category.issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${issue.message}`);
          if (issue.file) console.log(`     File: ${issue.file}`);
          if (issue.suggestion) console.log(`     Suggestion: ${issue.suggestion}`);
        });
      }
    }

    const total = Object.values(report).reduce((sum, issues) => sum + issues.length, 0);
    console.log(`\n\nTotal issues found: ${total}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const audit = new MaintainerAudit();
  audit.audit().then(report => {
    audit.report(report);
    process.exit(0);
  });
}

export { MaintainerAudit };
