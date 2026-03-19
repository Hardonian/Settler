#!/usr/bin/env tsx
/**
 * Demo Seed Verification Script
 * 
 * Verifies that demo data files exist and are valid.
 * Used to check that demo mode will work correctly.
 * 
 * Usage:
 *   pnpm seed:verify              # Verify demo data files
 *   tsx scripts/seed-verify.ts   # Direct execution
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more failures
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  file: string;
  exists: boolean;
  validJson: boolean;
  recordCount?: number;
  error?: string;
}

interface DemoDataFile {
  filename: string;
  expectedMinRecords: number;
  description: string;
}

const DEMO_DATA_DIR = path.join(process.cwd(), 'demo', 'data');

const REQUIRED_FILES: DemoDataFile[] = [
  {
    filename: 'demo_stripe_transactions.json',
    expectedMinRecords: 1,
    description: 'Stripe demo transactions',
  },
  {
    filename: 'demo_bank_transactions.json',
    expectedMinRecords: 1,
    description: 'Bank demo transactions',
  },
  {
    filename: 'demo_expected_matches.json',
    expectedMinRecords: 0,
    description: 'Expected matches for demo data',
  },
];

function verifyFile(file: DemoDataFile): VerificationResult {
  const filePath = path.join(DEMO_DATA_DIR, file.filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      file: file.filename,
      exists: false,
      validJson: false,
      error: `File does not exist at ${filePath}`,
    };
  }
  
  // Try to parse JSON
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Check if it's an array
    if (!Array.isArray(data)) {
      return {
        file: file.filename,
        exists: true,
        validJson: true,
        recordCount: 0,
        error: 'File content is not a JSON array',
      };
    }
    
    // Check minimum record count
    if (data.length < file.expectedMinRecords) {
      return {
        file: file.filename,
        exists: true,
        validJson: true,
        recordCount: data.length,
        error: `Expected at least ${file.expectedMinRecords} records, found ${data.length}`,
      };
    }
    
    return {
      file: file.filename,
      exists: true,
      validJson: true,
      recordCount: data.length,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      file: file.filename,
      exists: true,
      validJson: false,
      error: `Failed to parse JSON: ${errorMessage}`,
    };
  }
}

function checkDemoDataDirectory(): { exists: boolean; path: string } {
  if (!fs.existsSync(DEMO_DATA_DIR)) {
    return { exists: false, path: DEMO_DATA_DIR };
  }
  
  // Check if directory is empty
  const files = fs.readdirSync(DEMO_DATA_DIR);
  if (files.length === 0) {
    return { exists: false, path: DEMO_DATA_DIR };
  }
  
  return { exists: true, path: DEMO_DATA_DIR };
}

async function main() {
  console.log('🔍 Demo Data Verification\n');
  console.log(`   Checking: ${DEMO_DATA_DIR}\n`);
  
  const dirCheck = checkDemoDataDirectory();
  
  if (!dirCheck.exists) {
    console.log('❌ FAIL: Demo data directory does not exist or is empty');
    console.log(`   Path: ${dirCheck.path}`);
    console.log('\n📋 Remediation:');
    console.log('   Run: pnpm demo:seed');
    console.log('   Or:  npx tsx scripts/seed-demo.ts\n');
    process.exit(1);
  }
  
  console.log('✅ Demo data directory exists\n');
  console.log('📄 Checking required files:\n');
  
  const results: VerificationResult[] = [];
  let allPassed = true;
  
  for (const file of REQUIRED_FILES) {
    const result = verifyFile(file);
    results.push(result);
    
    if (result.exists && result.validJson && !result.error) {
      console.log(`   ✅ ${file.filename}`);
      console.log(`      ${file.description}: ${result.recordCount} records`);
    } else if (!result.exists) {
      console.log(`   ❌ ${file.filename} - FILE NOT FOUND`);
      allPassed = false;
    } else if (!result.validJson) {
      console.log(`   ❌ ${file.filename} - INVALID JSON`);
      console.log(`      Error: ${result.error}`);
      allPassed = false;
    } else if (result.error) {
      console.log(`   ⚠️  ${file.filename} - INSUFFICIENT DATA`);
      console.log(`      ${result.error}`);
      allPassed = false;
    }
    
    if (result.error && result.exists && result.validJson) {
      // This is a warning, not a failure
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('\n✅ VERIFICATION PASSED');
    console.log('\n📊 Demo data is ready for use.');
    console.log('   The playground and demo features should work correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ VERIFICATION FAILED');
    console.log('\n📋 Remediation:');
    console.log('   Run: pnpm demo:seed');
    console.log('   Or:  npx tsx scripts/seed-demo.ts\n');
    console.log('   To regenerate demo data files.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Verification script crashed:', error);
  process.exit(1);
});
