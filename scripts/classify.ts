#!/usr/bin/env tsx
/**
 * Classification Tool
 * 
 * Scans the repository and classifies files into:
 * - OSS_PUBLIC: Safe to publish publicly
 * - PLATFORM_PROPRIETARY: Licensed platform code
 * - INTERNAL_BUSINESS: Business strategy/investor materials
 * - SECRET_RISK: Secrets or sensitive credentials
 * 
 * Usage:
 *   pnpm classify
 *   pnpm classify --json
 *   pnpm classify --strict
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

type Classification = 'OSS_PUBLIC' | 'PLATFORM_PROPRIETARY' | 'INTERNAL_BUSINESS' | 'SECRET_RISK' | 'UNCLASSIFIED';

interface FileClassification {
  path: string;
  classification: Classification;
  reason: string;
  contentFlags?: string[];
  imports?: string[];
  violations?: string[];
}

interface ClassificationReport {
  version: string;
  timestamp: string;
  summary: {
    total: number;
    oss_public: number;
    platform_proprietary: number;
    internal_business: number;
    secret_risk: number;
    unclassified: number;
  };
  files: FileClassification[];
  violations: Array<{
    type: string;
    file: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
  }>;
}

// Path-based classification rules
const OSS_PUBLIC_PATHS = [
  'packages/sdk/**',
  'packages/sdk-python/**',
  'packages/sdk-go/**',
  'packages/sdk-ruby/**',
  'packages/api-client/**',
  'packages/protocol/**',
  'packages/react-settler/**',
  'packages/cli/**',
  'docs/public/**',
  'examples/**',
];

const PLATFORM_PROPRIETARY_PATHS = [
  'packages/web/**',
  'packages/api/**',
  'packages/adapters/**',
  'packages/edge-ai-core/**',
  'packages/edge-node/**',
  'prisma/**',
  'supabase/**',
  'config/**',
  'apps/**',
  'vercel.json',
  'turbo.json',
];

const INTERNAL_BUSINESS_PATHS = [
  'internal/**',
  'strategic/**',
  'docs/internal/**',
  'docs/investor/**',
  'docs/business/**',
];

const SECRET_RISK_PATHS = [
  '**/.env',
  '**/.env.local',
  '**/.env.*.local',
  '**/*secret*',
  '**/*key*',
  '**/*token*',
  '**/*credential*',
  '**/*password*',
  '**/secrets/**',
  '**/.secrets/**',
];

// Content-based patterns
const INTERNAL_BUSINESS_KEYWORDS = [
  'investor',
  'pitch',
  'financial',
  'revenue',
  'pricing strategy',
  'go-to-market',
  'confidential',
  'NDA',
  'competitive',
  'moat',
  'valuation',
  'seed round',
  'series [a-z]',
  'due diligence',
  'exit strategy',
  'acquisition',
  'IPO',
];

const SECRET_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY=(sk_live_|sk_test_)/i,
  /STRIPE_SECRET_KEY=(sk_live_|sk_test_)/i,
  /BEGIN PRIVATE KEY/,
  /BEGIN RSA PRIVATE KEY/,
  /BEGIN EC PRIVATE KEY/,
  /-----BEGIN[\s\S]{100,}-----END/i, // Private key blocks
  /[a-zA-Z0-9]{64,}/, // Long alphanumeric strings (potential API keys)
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, // JWT tokens
];

const PROPRIETARY_LICENSE_PATTERNS = [
  /"private"\s*:\s*true/i,
  /"license"\s*:\s*"UNLICENSED"/i,
  /Enterprise only/i,
  /Commercial feature/i,
  /License required/i,
  /Pro feature/i,
  /Premium feature/i,
];

// Import patterns that indicate proprietary dependencies
const PROPRIETARY_IMPORT_PATTERNS = [
  /from ['"]@settler\/web['"]/,
  /from ['"]@settler\/api['"]/,
  /from ['"]\.\.\/\.\.\/internal\//,
  /from ['"]\.\.\/internal\//,
  /from ['"]\.\.\/\.\.\/proprietary\//,
  /from ['"]\.\.\/proprietary\//,
  /from ['"]prisma['"]/,
  /from ['"]@prisma\/client['"]/,
];

const OSS_IMPORT_PATTERNS = [
  /from ['"]@settler\/sdk['"]/,
  /from ['"]@settler\/protocol['"]/,
  /from ['"]@settler\/react-settler['"]/,
  /from ['"]@settler\/cli['"]/,
];

async function getAllFiles(rootDir: string = '.'): Promise<string[]> {
  const files: string[] = [];
  
  // Default ignore patterns
  let ignorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.vercel/**',
    '**/artifacts/**',
    '**/.mirror-out/**',
    '**/*.tsbuildinfo',
  ];
  
  // Load .classifyignore if it exists
  try {
    const ignoreFile = path.join(rootDir, '.classifyignore');
    const ignoreContent = await fs.readFile(ignoreFile, 'utf-8');
    const customIgnores = ignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        // Convert to glob pattern
        if (line.endsWith('/')) {
          return `${line}**`;
        }
        return line.startsWith('/') ? line.substring(1) : line;
      });
    ignorePatterns = [...ignorePatterns, ...customIgnores];
  } catch (error) {
    // .classifyignore doesn't exist, use defaults only
  }

  const allFiles = await glob('**/*', {
    cwd: rootDir,
    ignore: ignorePatterns,
    nodir: true,
  });

  return allFiles.map(f => path.resolve(rootDir, f));
}

function matchesPattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return patterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
    return regex.test(normalizedPath);
  });
}

async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    // Skip binary files or unreadable files
    return null;
  }
}

function checkContentPatterns(content: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(content));
}

function findContentFlags(content: string, keywords: string[]): string[] {
  const flags: string[] = [];
  const lowerContent = content.toLowerCase();
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword.replace(/\[a-z\]/g, '[a-z]'), 'i');
    if (regex.test(lowerContent)) {
      flags.push(keyword);
    }
  });
  
  return flags;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // Match ES6 imports
  const es6Imports = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of es6Imports) {
    imports.push(match[1]);
  }
  
  // Match require statements
  const requireImports = content.matchAll(/require\(['"]([^'"]+)['"]\)/g);
  for (const match of requireImports) {
    imports.push(match[1]);
  }
  
  return imports;
}

function classifyFile(filePath: string, content: string | null): FileClassification {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  
  // 1. Check SECRET_RISK first (highest priority)
  if (matchesPattern(relativePath, SECRET_RISK_PATHS)) {
    return {
      path: relativePath,
      classification: 'SECRET_RISK',
      reason: `path_match: SECRET_RISK pattern`,
    };
  }
  
  if (content) {
    // Check for actual secrets in content
    if (checkContentPatterns(content, SECRET_PATTERNS)) {
      return {
        path: relativePath,
        classification: 'SECRET_RISK',
        reason: `content_match: SECRET_RISK pattern detected`,
        contentFlags: ['secret_pattern'],
      };
    }
  }
  
  // 2. Check INTERNAL_BUSINESS paths
  if (matchesPattern(relativePath, INTERNAL_BUSINESS_PATHS)) {
    const contentFlags = content ? findContentFlags(content, INTERNAL_BUSINESS_KEYWORDS) : [];
    return {
      path: relativePath,
      classification: 'INTERNAL_BUSINESS',
      reason: `path_match: INTERNAL_BUSINESS pattern`,
      contentFlags: contentFlags.length > 0 ? contentFlags : undefined,
    };
  }
  
  // 3. Check PLATFORM_PROPRIETARY paths
  if (matchesPattern(relativePath, PLATFORM_PROPRIETARY_PATHS)) {
    return {
      path: relativePath,
      classification: 'PLATFORM_PROPRIETARY',
      reason: `path_match: PLATFORM_PROPRIETARY pattern`,
    };
  }
  
  // 4. Check OSS_PUBLIC paths
  if (matchesPattern(relativePath, OSS_PUBLIC_PATHS)) {
    const violations: string[] = [];
    const imports = content ? extractImports(content) : [];
    
    // Check if OSS package imports proprietary code
    if (content) {
      const hasProprietaryImport = PROPRIETARY_IMPORT_PATTERNS.some(pattern => pattern.test(content));
      if (hasProprietaryImport) {
        violations.push('OSS_PUBLIC package imports PLATFORM_PROPRIETARY');
        return {
          path: relativePath,
          classification: 'PLATFORM_PROPRIETARY', // Reclassify
          reason: `import_violation: OSS_PUBLIC package imports PLATFORM_PROPRIETARY`,
          imports,
          violations,
        };
      }
    }
    
    return {
      path: relativePath,
      classification: 'OSS_PUBLIC',
      reason: `path_match: OSS_PUBLIC pattern`,
      imports: imports.length > 0 ? imports : undefined,
    };
  }
  
  // 5. Content-based classification for unclassified files
  if (content) {
    // Check for INTERNAL_BUSINESS keywords
    const businessFlags = findContentFlags(content, INTERNAL_BUSINESS_KEYWORDS);
    if (businessFlags.length > 0 && !relativePath.includes('docs/public')) {
      return {
        path: relativePath,
        classification: 'INTERNAL_BUSINESS',
        reason: `content_match: INTERNAL_BUSINESS keywords detected`,
        contentFlags: businessFlags,
      };
    }
    
    // Check for proprietary license markers
    if (checkContentPatterns(content, PROPRIETARY_LICENSE_PATTERNS)) {
      return {
        path: relativePath,
        classification: 'PLATFORM_PROPRIETARY',
        reason: `content_match: PROPRIETARY license marker`,
      };
    }
  }
  
  // 6. Default to UNCLASSIFIED
  return {
    path: relativePath,
    classification: 'UNCLASSIFIED',
    reason: 'no_matching_rule',
  };
}

async function generateReport(files: FileClassification[]): Promise<ClassificationReport> {
  const summary = {
    total: files.length,
    oss_public: files.filter(f => f.classification === 'OSS_PUBLIC').length,
    platform_proprietary: files.filter(f => f.classification === 'PLATFORM_PROPRIETARY').length,
    internal_business: files.filter(f => f.classification === 'INTERNAL_BUSINESS').length,
    secret_risk: files.filter(f => f.classification === 'SECRET_RISK').length,
    unclassified: files.filter(f => f.classification === 'UNCLASSIFIED').length,
  };
  
  const violations: ClassificationReport['violations'] = [];
  
  // Collect violations
  files.forEach(file => {
    if (file.classification === 'SECRET_RISK') {
      violations.push({
        type: 'secret_detected',
        file: file.path,
        severity: 'critical',
        message: 'Actual secret value or secret file detected',
      });
    }
    
    if (file.violations && file.violations.length > 0) {
      file.violations.forEach(violation => {
        violations.push({
          type: 'oss_imports_proprietary',
          file: file.path,
          severity: 'high',
          message: violation,
        });
      });
    }
  });
  
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    summary,
    files,
    violations,
  };
}

async function writeReport(report: ClassificationReport, outputDir: string = 'artifacts') {
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write JSON report
  const jsonPath = path.join(outputDir, 'classification-report.json');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report written to ${jsonPath}`);
  
  // Write Markdown summary
  const mdPath = path.join(outputDir, 'classification-summary.md');
  const mdContent = generateMarkdownSummary(report);
  await fs.writeFile(mdPath, mdContent);
  console.log(`✅ Markdown summary written to ${mdPath}`);
}

function generateMarkdownSummary(report: ClassificationReport): string {
  const { summary, violations } = report;
  
  let md = `# Classification Report\n\n`;
  md += `**Generated**: ${report.timestamp}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- **Total Files**: ${summary.total}\n`;
  md += `- **OSS_PUBLIC**: ${summary.oss_public} ✅\n`;
  md += `- **PLATFORM_PROPRIETARY**: ${summary.platform_proprietary}\n`;
  md += `- **INTERNAL_BUSINESS**: ${summary.internal_business}\n`;
  md += `- **SECRET_RISK**: ${summary.secret_risk} ${summary.secret_risk > 0 ? '❌' : '✅'}\n`;
  md += `- **UNCLASSIFIED**: ${summary.unclassified}\n\n`;
  
  if (violations.length > 0) {
    md += `## ⚠️ Violations (${violations.length})\n\n`;
    violations.forEach(violation => {
      md += `### ${violation.severity.toUpperCase()}: ${violation.type}\n`;
      md += `- **File**: \`${violation.file}\`\n`;
      md += `- **Message**: ${violation.message}\n\n`;
    });
  } else {
    md += `## ✅ No Violations\n\n`;
  }
  
  md += `## Files by Classification\n\n`;
  
  const byClassification = report.files.reduce((acc, file) => {
    if (!acc[file.classification]) {
      acc[file.classification] = [];
    }
    acc[file.classification].push(file);
    return acc;
  }, {} as Record<Classification, FileClassification[]>);
  
  Object.entries(byClassification).forEach(([classification, files]) => {
    md += `### ${classification} (${files.length})\n\n`;
    files.slice(0, 20).forEach(file => {
      md += `- \`${file.path}\` - ${file.reason}\n`;
    });
    if (files.length > 20) {
      md += `- ... and ${files.length - 20} more\n`;
    }
    md += `\n`;
  });
  
  return md;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const strict = args.includes('--strict');
  
  console.log('🔍 Scanning repository...\n');
  
  const files = await getAllFiles();
  console.log(`Found ${files.length} files\n`);
  
  const classifications: FileClassification[] = [];
  
  for (const filePath of files) {
    const content = await readFileContent(filePath);
    const classification = classifyFile(filePath, content);
    classifications.push(classification);
    
    if (!jsonOnly && classifications.length % 100 === 0) {
      process.stdout.write(`\rProcessed ${classifications.length}/${files.length} files...`);
    }
  }
  
  if (!jsonOnly) {
    process.stdout.write(`\rProcessed ${classifications.length}/${files.length} files...\n\n`);
  }
  
  const report = await generateReport(classifications);
  
  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    await writeReport(report);
    console.log('\n📊 Classification complete!\n');
    console.log(`Summary:`);
    console.log(`  OSS_PUBLIC: ${report.summary.oss_public}`);
    console.log(`  PLATFORM_PROPRIETARY: ${report.summary.platform_proprietary}`);
    console.log(`  INTERNAL_BUSINESS: ${report.summary.internal_business}`);
    console.log(`  SECRET_RISK: ${report.summary.secret_risk} ${report.summary.secret_risk > 0 ? '❌' : '✅'}`);
    console.log(`  UNCLASSIFIED: ${report.summary.unclassified}`);
    
    if (report.violations.length > 0) {
      console.log(`\n⚠️  Found ${report.violations.length} violations:`);
      report.violations.forEach(v => {
        console.log(`  - ${v.severity.toUpperCase()}: ${v.file} - ${v.message}`);
      });
      
      if (strict) {
        console.log('\n❌ Strict mode: Exiting with error due to violations');
        process.exit(1);
      }
    } else {
      console.log('\n✅ No violations detected');
    }
  }
  
  // Exit with error if SECRET_RISK detected
  if (report.summary.secret_risk > 0) {
    console.error('\n❌ CRITICAL: SECRET_RISK files detected. CI must fail.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Classification error:', error);
  process.exit(1);
});
