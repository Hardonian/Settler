/**
 * Data Retention Enforcement Script
 * 
 * Runs data retention enforcement for all billing accounts.
 * Should be scheduled to run daily.
 */

import { enforceAllRetentionPolicies } from '../packages/api/src/services/data-retention/enforcer';

async function main() {
  console.log('🔄 Starting data retention enforcement...\n');
  
  try {
    const result = await enforceAllRetentionPolicies();
    
    console.log('✅ Data retention enforcement completed');
    console.log(`   Accounts processed: ${result.accountsProcessed}`);
    console.log(`   Records deleted: ${result.totalDeleted}`);
    console.log(`   Errors: ${result.totalErrors}`);
    
    if (result.totalErrors > 0) {
      console.log('\n⚠️  Some errors occurred during enforcement');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Data retention enforcement failed:', error);
    process.exit(1);
  }
}

main();
