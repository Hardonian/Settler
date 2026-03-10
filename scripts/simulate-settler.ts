import * as fs from "node:fs";
import * as path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";

type RunMode = "daily" | "batch" | "api" | "manual";
type EventType =
  | "reconciliation_run_started"
  | "reconciliation_run_completed"
  | "reconciliation_run_failed"
  | "api_request"
  | "error_thrown";

interface SimulationConfig {
  seed: number;
  days: number;
  transactionsPerDay: number;
  outputDir: string;
  replayDir: string;
  reportPath: string;
}

interface TransactionRecord {
  transactionId: string;
  day: string;
  amountMinor: number;
  currency: "USD" | "EUR";
  processorStatus: "captured" | "settled" | "refunded";
  ledgerStatus: "posted" | "pending";
  settlementStatus: "settled" | "missing";
  isMatch: boolean;
  manualReview: boolean;
  anomalyType?: "duplicate" | "missing_settlement" | "currency_mismatch" | "timestamp_skew";
}

interface RunResult {
  runId: string;
  mode: RunMode;
  day: string;
  sourceCount: number;
  matchedCount: number;
  manualReviewCount: number;
  durationMs: number;
  status: "completed" | "failed";
  alerts: string[];
}

interface ExplorerEntry {
  runId: string;
  tenantId: string;
  recordsProcessed: number;
  matchRate: number;
  manualReviewCount: number;
  durationMs: number;
  executionStatus: string;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

function rng(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function buildPool(): Pool | null {
  try {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 2,
    });
  } catch {
    return null;
  }
}

async function resolveTenantContext(pool: Pool): Promise<{ tenantId: string; userId: string }> {
  if (process.env.SIM_TENANT_ID && process.env.SIM_USER_ID) {
    return { tenantId: process.env.SIM_TENANT_ID, userId: process.env.SIM_USER_ID };
  }
  const result = await pool.query<{
    tenant_id: string;
    user_id: string;
  }>(`SELECT t.id::text as tenant_id, u.id::text as user_id
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      ORDER BY t.created_at ASC, u.created_at ASC
      LIMIT 1`);
  const first = result.rows[0];
  if (!first) throw new Error("No tenant/user pair found. Set SIM_TENANT_ID and SIM_USER_ID.");
  return { tenantId: first.tenant_id, userId: first.user_id };
}

function generateDayTransactions(
  day: string,
  txCount: number,
  random: () => number
): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  for (let i = 0; i < txCount; i += 1) {
    const amountMinor = Math.floor(100 + random() * 400000);
    const anomalyRoll = random();
    let anomalyType: TransactionRecord["anomalyType"];
    if (anomalyRoll < 0.01) anomalyType = "duplicate";
    else if (anomalyRoll < 0.02) anomalyType = "missing_settlement";
    else if (anomalyRoll < 0.03) anomalyType = "currency_mismatch";
    else if (anomalyRoll < 0.04) anomalyType = "timestamp_skew";

    const isMatch = random() < 0.94 && anomalyType !== "missing_settlement";
    const manualReview = !isMatch ? random() < 0.25 : random() < 0.04;

    records.push({
      transactionId: `txn_${day.replace(/-/g, "")}_${i.toString().padStart(6, "0")}`,
      day,
      amountMinor,
      currency: anomalyType === "currency_mismatch" ? "EUR" : "USD",
      processorStatus: random() < 0.03 ? "refunded" : random() < 0.8 ? "captured" : "settled",
      ledgerStatus: random() < 0.95 ? "posted" : "pending",
      settlementStatus: anomalyType === "missing_settlement" ? "missing" : "settled",
      isMatch,
      manualReview,
      anomalyType,
    });
  }
  return records;
}

function selectRunSlice(records: TransactionRecord[], mode: RunMode): TransactionRecord[] {
  if (mode === "daily") return records;
  if (mode === "batch") return records.filter((_, idx) => idx % 2 === 0);
  if (mode === "api") return records.filter((_, idx) => idx % 3 === 0);
  return records.filter((_, idx) => idx % 5 === 0);
}

function createAlertMessages(run: RunResult, apiErrorRate: number): string[] {
  const alerts: string[] = [];
  const matchRate = run.sourceCount > 0 ? (run.matchedCount / run.sourceCount) * 100 : 0;
  const manualRate = run.sourceCount > 0 ? (run.manualReviewCount / run.sourceCount) * 100 : 0;
  if (matchRate < 85) alerts.push(`match_rate=${matchRate.toFixed(2)} below 85`);
  if (manualRate > 10) alerts.push(`manual_review_rate=${manualRate.toFixed(2)} above 10`);
  if (run.durationMs > 60000) alerts.push(`duration_ms=${run.durationMs} above 60000`);
  if (apiErrorRate > 5) alerts.push(`api_error_rate=${apiErrorRate.toFixed(2)} above 5`);
  return alerts;
}

async function sendAlert(
  integration: "slack" | "telegram" | "teams",
  message: string
): Promise<void> {
  const configured =
    (integration === "slack" && process.env.SLACK_WEBHOOK_URL) ||
    (integration === "telegram" &&
      process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_CHAT_ID) ||
    (integration === "teams" && process.env.TEAMS_WEBHOOK_URL);

  if (!configured) {
    fs.appendFileSync("reports/dogfood-alerts.log", `[stub:${integration}] ${message}\n`);
    return;
  }
  fs.appendFileSync("reports/dogfood-alerts.log", `[live:${integration}] ${message}\n`);
}

async function maybeEmitEvent(
  pool: Pool | null,
  tenantId: string,
  eventType: EventType,
  runId: string,
  durationMs?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `INSERT INTO operator_runtime_events (
      event_type, tenant_id, run_id, duration_ms, metadata, occurred_at, created_at
    ) VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())`,
    [eventType, tenantId, runId, durationMs ?? null, JSON.stringify(metadata ?? {})]
  );
}

function computeHealth(
  runs: RunResult[],
  apiLatencies: number[],
  apiStatuses: number[],
  days: number
) {
  const durations = runs.map((r) => r.durationMs).sort((a, b) => a - b);
  const percentile = (arr: number[], p: number): number => {
    if (!arr.length) return 0;
    const idx = Math.floor((arr.length - 1) * p);
    return arr[idx] ?? 0;
  };
  const totalSource = runs.reduce((a, r) => a + r.sourceCount, 0);
  const totalMatched = runs.reduce((a, r) => a + r.matchedCount, 0);
  const totalManual = runs.reduce((a, r) => a + r.manualReviewCount, 0);
  return {
    runsPerDay: runs.length / Math.max(days, 1),
    matchRate: (totalMatched / Math.max(totalSource, 1)) * 100,
    manualReviewRate: (totalManual / Math.max(totalSource, 1)) * 100,
    runDurationP50: percentile(durations, 0.5),
    runDurationP95: percentile(durations, 0.95),
    errorRate: (apiStatuses.filter((s) => s >= 500).length / Math.max(apiStatuses.length, 1)) * 100,
    apiLatencyP50: percentile(
      [...apiLatencies].sort((a, b) => a - b),
      0.5
    ),
    apiLatencyP95: percentile(
      [...apiLatencies].sort((a, b) => a - b),
      0.95
    ),
  };
}

async function main(): Promise<void> {
  const cfg: SimulationConfig = {
    seed: Number(process.env.SIM_SEED ?? "42"),
    days: Number(process.env.SIM_DAYS ?? "14"),
    transactionsPerDay: Number(process.env.SIM_TX_PER_DAY ?? "7000"),
    outputDir: "test-data/reconciliation-scenarios",
    replayDir: "replay-artifacts",
    reportPath: "reports/dogfood-simulation.md",
  };

  if (cfg.days < 7 || cfg.days > 30) throw new Error("SIM_DAYS must be between 7 and 30");
  if (cfg.transactionsPerDay < 5000 || cfg.transactionsPerDay > 50000) {
    throw new Error("SIM_TX_PER_DAY must be between 5000 and 50000");
  }

  ensureDir(cfg.outputDir);
  ensureDir(cfg.replayDir);
  ensureDir("reports");

  const random = rng(cfg.seed);
  const pool = buildPool();
  let dbEnabled = false;
  let tenantId = process.env.SIM_TENANT_ID ?? "sim-tenant";
  let userId = process.env.SIM_USER_ID ?? randomUUID();

  if (pool) {
    try {
      await pool.query("SELECT 1");
      const context = await resolveTenantContext(pool);
      tenantId = context.tenantId;
      userId = context.userId;
      dbEnabled = true;
    } catch {
      dbEnabled = false;
    }
  }

  const activePool = dbEnabled ? pool : null;

  const start = new Date("2026-01-01T00:00:00.000Z");
  const days: { day: string; transactions: TransactionRecord[] }[] = [];
  for (let d = 0; d < cfg.days; d += 1) {
    const dayDate = new Date(start.getTime() + d * 86400000);
    const day = dayDate.toISOString().slice(0, 10);
    days.push({ day, transactions: generateDayTransactions(day, cfg.transactionsPerDay, random) });
  }

  const allTransactions = days.flatMap((d) => d.transactions);
  const runModes: RunMode[] = ["daily", "batch", "api", "manual"];
  const runs: RunResult[] = [];
  const explorer: ExplorerEntry[] = [];
  let injectedAlertCount = 0;
  const apiLatencies: number[] = [];
  const apiStatuses: number[] = [];

  for (const dayEntry of days) {
    for (const mode of runModes) {
      const runId = randomUUID();
      const sample = selectRunSlice(dayEntry.transactions, mode);
      const sourceCount = sample.length;
      const matchedCount = sample.filter((t) => t.isMatch).length;
      const manualReviewCount = sample.filter((t) => t.manualReview).length;
      const durationMs = Math.floor(4000 + sourceCount * (0.8 + random() * 0.5));
      const status: "completed" | "failed" = "completed";
      const startedAt = new Date(`${dayEntry.day}T08:00:00.000Z`);
      const completedAt = new Date(startedAt.getTime() + durationMs);

      if (activePool) {
        await pool.query(
          `INSERT INTO reconciliation_runs (
            id, tenant_id, user_id, status, started_at, completed_at, source_count, target_count,
            matched_count, unmatched_source_count, unmatched_target_count, confidence_avg, metadata,
            trace_id, created_at, updated_at, error_message
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16,$17)`,
          [
            runId,
            tenantId,
            userId,
            status,
            startedAt,
            status === "completed" ? completedAt : null,
            sourceCount,
            sourceCount,
            matchedCount,
            sourceCount - matchedCount,
            sourceCount - matchedCount,
            0.92,
            JSON.stringify({ mode, simulation: true, seed: cfg.seed }),
            `sim-${cfg.seed}-${dayEntry.day}-${mode}`,
            startedAt,
            completedAt,
            status === "failed" ? "Synthetic failure injection" : null,
          ]
        );
      }

      await maybeEmitEvent(activePool, tenantId, "reconciliation_run_started", runId, undefined, {
        mode,
      });
      await maybeEmitEvent(
        activePool,
        tenantId,
        status === "completed" ? "reconciliation_run_completed" : "reconciliation_run_failed",
        runId,
        durationMs,
        { sourceCount, matchedCount, manualReviewCount }
      );
      if (status === "failed") {
        await maybeEmitEvent(activePool, tenantId, "error_thrown", runId, undefined, {
          reason: "synthetic",
        });
      }

      for (let i = 0; i < 5; i += 1) {
        const statusCode = random() < 0.04 ? 500 : 200;
        const latency = Math.floor(40 + random() * 700);
        apiLatencies.push(latency);
        apiStatuses.push(statusCode);

        if (activePool) {
          await pool.query(
            "INSERT INTO request_metrics (tenant_id, route, method, status_code, latency_ms, cache_hit, rate_limited, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              tenantId,
              "/api/v1/reconciliation/runs",
              "POST",
              statusCode,
              latency,
              false,
              false,
              startedAt,
            ]
          );
        }

        await maybeEmitEvent(activePool, tenantId, "api_request", runId, latency, { statusCode });
      }

      const runRecord: RunResult = {
        runId,
        mode,
        day: dayEntry.day,
        sourceCount,
        matchedCount,
        manualReviewCount,
        durationMs,
        status,
        alerts: [],
      };
      const apiErrorRate =
        (apiStatuses.filter((s) => s >= 500).length / Math.max(apiStatuses.length, 1)) * 100;
      runRecord.alerts = createAlertMessages(runRecord, apiErrorRate);
      for (const alert of runRecord.alerts) {
        await Promise.all([
          sendAlert("slack", `${runId}: ${alert}`),
          sendAlert("telegram", `${runId}: ${alert}`),
          sendAlert("teams", `${runId}: ${alert}`),
        ]);
      }

      const replayPayload = {
        runId,
        tenantId,
        mode,
        inputTransactions: sample,
        matchingResults: {
          matchedCount,
          unmatchedCount: sourceCount - matchedCount,
          manualReviewCount,
        },
        policyConfiguration: {
          matchingToleranceBps: 30,
          maxTimestampSkewMinutes: 120,
          enableDuplicateSuppression: true,
        },
        runtimeMetadata: {
          day: dayEntry.day,
          status,
          durationMs,
          generatedAt: new Date().toISOString(),
        },
      };
      const replayBundle = { ...replayPayload, hashSignature: sha256(replayPayload) };
      fs.writeFileSync(
        path.join(cfg.replayDir, `${runId}.json`),
        JSON.stringify(replayBundle, null, 2)
      );

      explorer.push({
        runId,
        tenantId,
        recordsProcessed: sourceCount,
        matchRate: (matchedCount / Math.max(sourceCount, 1)) * 100,
        manualReviewCount,
        durationMs,
        executionStatus: status,
        startedAt: startedAt.toISOString(),
        completedAt: status === "completed" ? completedAt.toISOString() : null,
        errorMessage: status === "failed" ? "Synthetic failure injection" : null,
      });
      runs.push(runRecord);
    }
  }

  if (runs.length > 0) {
    const anomalyRunId = `${runs[0].runId}-anomaly`;
    await maybeEmitEvent(activePool, tenantId, "reconciliation_run_failed", anomalyRunId, 1200, {
      reason: "anomaly-drill",
    });
    await maybeEmitEvent(activePool, tenantId, "error_thrown", anomalyRunId, undefined, {
      reason: "anomaly-drill",
    });
    await Promise.all([
      sendAlert("slack", `${anomalyRunId}: anomaly drill triggered`),
      sendAlert("telegram", `${anomalyRunId}: anomaly drill triggered`),
      sendAlert("teams", `${anomalyRunId}: anomaly drill triggered`),
    ]);
    injectedAlertCount = 3;
  }

  const scenario = {
    seed: cfg.seed,
    generatedAt: new Date().toISOString(),
    days: cfg.days,
    transactionsPerDay: cfg.transactionsPerDay,
    matchRateTarget: 92,
    manualReviewTargetRange: [5, 8],
    failureRateTargetMax: 1,
    transactions: allTransactions,
  };
  const scenarioPath = path.join(
    cfg.outputDir,
    `scenario-seed${cfg.seed}-d${cfg.days}-tpd${cfg.transactionsPerDay}.json`
  );
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario, null, 2));
  fs.writeFileSync(
    path.join(cfg.outputDir, `run-explorer-seed${cfg.seed}.json`),
    JSON.stringify(explorer, null, 2)
  );

  const health = computeHealth(runs, apiLatencies, apiStatuses, cfg.days);
  const totalSource = runs.reduce((acc, run) => acc + run.sourceCount, 0);
  const totalMatched = runs.reduce((acc, run) => acc + run.matchedCount, 0);
  const totalManual = runs.reduce((acc, run) => acc + run.manualReviewCount, 0);
  const failedRuns = runs.filter((r) => r.status === "failed").length;
  const triggeredAlerts =
    runs.reduce((acc, run) => acc + run.alerts.length, 0) + injectedAlertCount;

  const report = `# Dogfood Simulation Report

## Dataset characteristics
- seed: ${cfg.seed}
- days: ${cfg.days}
- transactions_per_day: ${cfg.transactionsPerDay}
- transaction_records: ${allTransactions.length}
- dataset_file: ${scenarioPath}

## Runs executed
- runs_total: ${runs.length}
- run_modes: daily, batch, api, manual
- failed_runs: ${failedRuns}
- replay_bundles: ${runs.length}
- db_persistence: ${dbEnabled ? "enabled" : "disabled (no DB env/connection)"}

## Match statistics
- total_source_records: ${totalSource}
- match_rate: ${((totalMatched / Math.max(totalSource, 1)) * 100).toFixed(2)}
- manual_review_rate: ${((totalManual / Math.max(totalSource, 1)) * 100).toFixed(2)}
- failure_rate: ${((failedRuns / Math.max(runs.length, 1)) * 100).toFixed(2)}

## Alert triggers
- total_alerts_triggered: ${triggeredAlerts}
- alert_log: reports/dogfood-alerts.log

## System performance
- runs_per_day: ${health.runsPerDay.toFixed(2)}
- run_duration_p50_ms: ${health.runDurationP50.toFixed(2)}
- run_duration_p95_ms: ${health.runDurationP95.toFixed(2)}
- error_rate_pct: ${health.errorRate.toFixed(2)}
- api_latency_p50_ms: ${health.apiLatencyP50.toFixed(2)}
- api_latency_p95_ms: ${health.apiLatencyP95.toFixed(2)}
`;
  fs.writeFileSync(cfg.reportPath, report);

  if (pool) await pool.end().catch(() => undefined);

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dataset: scenarioPath,
        report: cfg.reportPath,
        replayBundles: runs.length,
        runExplorerEntries: explorer.length,
        dbEnabled,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  console.error("simulate:settler failed", error);
  process.exitCode = 1;
});
