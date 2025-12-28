#!/usr/bin/env tsx
/**
 * Generate Founder Weekly Report
 * 
 * Runs the weekly report generator and saves output to ops/reports/
 */

import { generateWeeklyReport, formatWeeklyReportMarkdown, saveWeeklyReport } from '../packages/api/src/ops/reports/weekly-report';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📊 Generating Founder Weekly Report...\n');
    
    const report = await generateWeeklyReport();
    const markdown = await formatWeeklyReportMarkdown(report);
    const reportPath = await saveWeeklyReport(report, markdown);
    
    console.log('✅ Weekly report generated successfully!');
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`\n📈 Summary:`);
    console.log(`   - Week: ${report.weekStart} to ${report.weekEnd}`);
    console.log(`   - New Signups: ${report.growth.newSignups} (${report.growth.weekOverWeekGrowth.signups >= 0 ? '+' : ''}${report.growth.weekOverWeekGrowth.signups} WoW)`);
    console.log(`   - Weekly API Calls: ${report.usage.apiCalls.toLocaleString()}`);
    console.log(`   - MRR: $${report.revenue.mrr.toLocaleString()}`);
    console.log(`   - Churn Rate: ${report.billingHealth.churnRate.toFixed(2)}%`);
    console.log(`   - Recommendations: ${report.recommendations.length}`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Top Recommendations:`);
      report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate weekly report:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
