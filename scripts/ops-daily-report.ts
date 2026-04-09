#!/usr/bin/env tsx
/**
 * Generate Founder Daily Report
 *
 * Runs the daily report generator and saves output to ops/reports/
 */

import {
  generateDailyReport,
  formatDailyReportMarkdown,
  saveDailyReport,
} from "../packages/api/src/ops/reports/daily-report";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set.");
      console.error("   Please set DATABASE_URL to your database connection string.");
      console.error('   Example: export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
      process.exit(1);
    }

    console.log("📊 Generating Founder Daily Report...\n");

    const report = await generateDailyReport();
    const markdown = await formatDailyReportMarkdown(report);
    const reportPath = await saveDailyReport(report, markdown);

    console.log("✅ Daily report generated successfully!");
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`\n📈 Summary:`);
    console.log(`   - New Signups: ${report.growth.newSignups}`);
    console.log(`   - New Tenants: ${report.growth.newTenants}`);
    console.log(`   - Daily API Calls: ${report.usage.daily.apiCalls.toLocaleString()}`);
    console.log(`   - MRR: $${report.revenue.mrr.toLocaleString()}`);
    console.log(`   - Past Due: ${report.billingHealth.pastDue}`);
    console.log(`   - Error Spikes: ${report.risk.errorSpikes}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to generate daily report:", error);
    if (error instanceof Error && error.message.includes("PrismaClient")) {
      console.error("\n💡 Tip: Make sure DATABASE_URL is set and points to a valid database.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
