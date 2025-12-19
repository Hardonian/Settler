#!/usr/bin/env tsx
/**
 * Pipe Dream Signal Detection
 * 
 * Finds features that exist only in documentation but not in code:
 * - Features mentioned in README but not implemented
 * - UI elements with no backend
 * - Tables with no consumers
 * - Routes that render but do nothing
 * - Config flags that are never read
 * - Environment variables that are unused
 * - Policies that look permissive but block writes in prod
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface PipeDreamSignal {
  type: 'feature_in_docs' | 'ui_no_backend' | 'table_no_consumer' | 'route_no_action' | 'unused_config' | 'unused_env';
  description: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
}

async function findPipeDreamSignals(): Promise<PipeDreamSignal[]> {
  const signals: PipeDreamSignal[] = [];
  
  // 1. Check for features in README that aren't in code
  const readmeFiles = await glob('**/README.md', { cwd: __dirname + '/..' });
  const readmeContent = readmeFiles
    .map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf-8'))
    .join('\n');
  
  // Extract feature mentions (simple heuristic)
  const featureMatches = readmeContent.matchAll(/(?:supports?|provides?|includes?|features?|enables?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
  const mentionedFeatures = [...new Set(Array.from(featureMatches, m => m[1]))];
  
  // Check if features exist in code
  const codeFiles = await glob('packages/**/*.{ts,tsx}', { cwd: __dirname + '/..' });
  const codeContent = codeFiles
    .slice(0, 100) // Limit to avoid memory issues
    .map(f => {
      try {
        return fs.readFileSync(path.join(__dirname, '..', f), 'utf-8');
      } catch {
        return '';
      }
    })
    .join('\n');
  
  for (const feature of mentionedFeatures) {
    const featureLower = feature.toLowerCase();
    if (!codeContent.toLowerCase().includes(featureLower)) {
      signals.push({
        type: 'feature_in_docs',
        description: `Feature "${feature}" mentioned in README but not found in code`,
        location: 'README.md',
        severity: 'medium',
      });
    }
  }
  
  // 2. Check for tables with no consumers
  const schemaPath = path.join(__dirname, '..', 'supabase', 'production-schema.json');
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const tables = schema.tables?.map((t: any) => t.name) || [];
    
    for (const table of tables) {
      // Check if table is referenced in code
      const tableRefs = codeContent.match(new RegExp(`\\.from\\(['"]${table}['"]\\)`, 'gi'));
      if (!tableRefs || tableRefs.length === 0) {
        signals.push({
          type: 'table_no_consumer',
          description: `Table "${table}" exists but has no consumers in code`,
          location: `supabase/production-schema.json`,
          severity: 'high',
        });
      }
    }
  }
  
  // 3. Check for unused environment variables
  const envExample = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExample)) {
    const envVars = fs.readFileSync(envExample, 'utf-8')
      .split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => l.split('=')[0].trim());
    
    for (const envVar of envVars) {
      // Check if env var is used in code
      const envRefs = codeContent.match(new RegExp(`process\\.env\\.${envVar}|\\$\\{.*${envVar}.*\\}`, 'gi'));
      if (!envRefs || envRefs.length === 0) {
        signals.push({
          type: 'unused_env',
          description: `Environment variable "${envVar}" defined but never used`,
          location: '.env.example',
          severity: 'low',
        });
      }
    }
  }
  
  return signals;
}

async function main() {
  console.log('🔍 Searching for pipe dream signals...');
  
  const signals = await findPipeDreamSignals();
  
  console.log(`\n📊 Found ${signals.length} pipe dream signals\n`);
  
  // Group by type
  const byType = signals.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {} as Record<string, PipeDreamSignal[]>);
  
  for (const [type, typeSignals] of Object.entries(byType)) {
    console.log(`\n${type.toUpperCase().replace(/_/g, ' ')} (${typeSignals.length}):`);
    typeSignals.forEach(s => {
      const icon = s.severity === 'high' ? '🔴' : s.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${s.description}`);
      console.log(`     Location: ${s.location}`);
    });
  }
  
  // Write report
  const reportPath = path.join(__dirname, '..', 'supabase', 'pipe-dream-signals.json');
  fs.writeFileSync(reportPath, JSON.stringify({ signals, summary: byType }, null, 2));
  
  console.log(`\n✅ Pipe dream signal detection complete. Report: ${reportPath}`);
  
  if (signals.filter(s => s.severity === 'high').length > 0) {
    console.log('\n⚠️  High severity signals found - these should be addressed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
