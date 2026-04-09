/**
 * Setup Default Alert Rules for Operator Mode
 * Creates default alert rules for key metrics
 */

import { query } from "../packages/api/src/db";
import { upsertAlertThreshold } from "../packages/api/src/services/operator-mode/alerting";
import { logInfo, logError } from "../packages/api/src/utils/logger";

// Default operator user ID (should be set via environment variable)
const OPERATOR_USER_ID = process.env.OPERATOR_USER_ID || "00000000-0000-0000-0000-000000000000";

interface DefaultAlertRule {
  name: string;
  metric: "error_rate" | "slow_endpoint" | "failed_ingestion" | "billing_anomaly" | "usage_limit";
  threshold: number;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  severity: "low" | "medium" | "high" | "critical";
  channels: Array<"email" | "slack" | "webhook">;
  enabled: boolean;
}

const DEFAULT_ALERT_RULES: DefaultAlertRule[] = [
  {
    name: "High Error Rate",
    metric: "error_rate",
    threshold: 0.05, // 5%
    operator: "gt",
    severity: "high",
    channels: ["slack"],
    enabled: true,
  },
  {
    name: "Critical Error Rate",
    metric: "error_rate",
    threshold: 0.1, // 10%
    operator: "gt",
    severity: "critical",
    channels: ["slack", "email"],
    enabled: true,
  },
  {
    name: "Slow Endpoints",
    metric: "slow_endpoint",
    threshold: 5000, // 5 seconds P95
    operator: "gt",
    severity: "medium",
    channels: ["slack"],
    enabled: true,
  },
  {
    name: "Failed Ingestions",
    metric: "failed_ingestion",
    threshold: 10, // 10 failures per day
    operator: "gt",
    severity: "high",
    channels: ["slack"],
    enabled: true,
  },
  {
    name: "Billing Anomalies",
    metric: "billing_anomaly",
    threshold: 5, // 5 anomalies per day
    operator: "gt",
    severity: "medium",
    channels: ["slack"],
    enabled: true,
  },
];

async function setupDefaultAlerts(): Promise<void> {
  logInfo("Setting up default alert rules", { operatorUserId: OPERATOR_USER_ID });

  try {
    // Verify operator user exists (or create a system user)
    const users = await query<{ id: string }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [
      OPERATOR_USER_ID,
    ]);

    if (users.length === 0) {
      logInfo("Operator user not found, creating system user", { userId: OPERATOR_USER_ID });
      // Create a system user for operator mode alerts
      await query(
        `INSERT INTO users (id, email, password_hash, tenant_id, role)
         VALUES ($1, 'operator@settler.dev', '', NULL, 'admin')
         ON CONFLICT (id) DO NOTHING`,
        [OPERATOR_USER_ID]
      );
    }

    // Create default alert rules
    const createdRules: string[] = [];
    const skippedRules: string[] = [];

    for (const rule of DEFAULT_ALERT_RULES) {
      try {
        // Check if rule already exists
        const existing = await query<{ id: string }>(
          `SELECT id FROM alert_rules 
           WHERE user_id = $1 AND name = $2`,
          [OPERATOR_USER_ID, rule.name]
        );

        if (existing.length > 0) {
          logInfo("Alert rule already exists, updating", { name: rule.name });
          await upsertAlertThreshold(OPERATOR_USER_ID, {
            ...rule,
            id: existing[0].id,
          });
          skippedRules.push(rule.name);
        } else {
          const ruleId = await upsertAlertThreshold(OPERATOR_USER_ID, rule);
          createdRules.push(rule.name);
          logInfo("Alert rule created", { name: rule.name, id: ruleId });
        }
      } catch (error) {
        logError("Failed to create alert rule", error, { name: rule.name });
      }
    }

    logInfo("Default alert rules setup completed", {
      created: createdRules.length,
      skipped: skippedRules.length,
      total: DEFAULT_ALERT_RULES.length,
    });

    console.log("\n✅ Default alert rules setup completed:");
    console.log(`   Created: ${createdRules.length}`);
    console.log(`   Skipped: ${skippedRules.length}`);
    console.log(`   Total: ${DEFAULT_ALERT_RULES.length}`);

    if (createdRules.length > 0) {
      console.log("\n   Created rules:");
      createdRules.forEach((name) => console.log(`   - ${name}`));
    }

    if (skippedRules.length > 0) {
      console.log("\n   Updated rules:");
      skippedRules.forEach((name) => console.log(`   - ${name}`));
    }
  } catch (error) {
    logError("Failed to setup default alert rules", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  setupDefaultAlerts()
    .then(() => {
      console.log("\n✅ Setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Setup failed:", error);
      process.exit(1);
    });
}

export { setupDefaultAlerts, DEFAULT_ALERT_RULES };
