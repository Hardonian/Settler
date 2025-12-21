/**
 * SLA Violation Check Script
 * 
 * Checks for SLA violations and alerts.
 * Should be scheduled to run every hour.
 */

import { checkSLAViolations } from '../packages/api/src/services/sla/tracker';

async function main() {
  console.log('🔍 Checking for SLA violations...\n');
  
  try {
    const result = await checkSLAViolations();
    
    console.log('✅ SLA violation check completed');
    console.log(`   Violations found: ${result.violations}`);
    console.log(`   Alerts sent: ${result.alerts_sent}`);
    
    if (result.violations > 0) {
      console.log('\n🔴 SLA violations detected!');
      console.log('   Check logs for details');
      process.exit(1);
    }
    
    console.log('\n✅ No SLA violations detected');
    process.exit(0);
  } catch (error) {
    console.error('❌ SLA violation check failed:', error);
    process.exit(1);
  }
}

main();
