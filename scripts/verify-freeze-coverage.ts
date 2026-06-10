import fs from "node:fs";
import path from "node:path";

interface RouteExpectation {
  file: string;
  method: "post" | "patch" | "delete";
  route: string;
}

const EXPECTED_PROTECTED_ROUTES: RouteExpectation[] = [
  { file: "packages/api/src/routes/runs.ts", method: "post", route: "/:runId/retry" },
  { file: "packages/api/src/routes/jobs.ts", method: "post", route: "/" },
  { file: "packages/api/src/routes/jobs.ts", method: "post", route: "/:id/run" },
  { file: "packages/api/src/routes/jobs.ts", method: "delete", route: "/:id" },
  { file: "packages/api/src/routes/exceptions.ts", method: "post", route: "/exceptions/:id/resolve" },
  {
    file: "packages/api/src/routes/exceptions.ts",
    method: "post",
    route: "/exceptions/bulk-resolve",
  },
  { file: "packages/api/src/routes/tenant-data.ts", method: "delete", route: "/data" },
  { file: "packages/api/src/routes/v1/advanced-matching-rules.ts", method: "post", route: "/" },
  {
    file: "packages/api/src/routes/v1/advanced-matching-rules.ts",
    method: "post",
    route: "/:ruleId/test",
  },
  { file: "packages/api/src/routes/v1/approvals.ts", method: "post", route: "/requests" },
  { file: "packages/api/src/routes/v1/approvals.ts", method: "post", route: "/approvers" },
  {
    file: "packages/api/src/routes/v1/approvals.ts",
    method: "post",
    route: "/requests/:approvalId/approve",
  },
  {
    file: "packages/api/src/routes/v1/approvals.ts",
    method: "post",
    route: "/requests/:approvalId/reject",
  },
  { file: "packages/api/src/routes/v1/bulk-operations.ts", method: "post", route: "/" },
  { file: "packages/api/src/routes/v1/custom-integrations.ts", method: "post", route: "/" },
  {
    file: "packages/api/src/routes/v1/custom-integrations.ts",
    method: "patch",
    route: "/:integrationId",
  },
  { file: "packages/api/src/routes/v1/dedicated-infrastructure.ts", method: "post", route: "/" },
  {
    file: "packages/api/src/routes/v1/dedicated-infrastructure.ts",
    method: "delete",
    route: "/:infrastructureId",
  },
  { file: "packages/api/src/routes/v1/ingestion.ts", method: "post", route: "/sources" },
  { file: "packages/api/src/routes/v1/ingestion.ts", method: "post", route: "/upload" },
  { file: "packages/api/src/routes/v1/ingestion.ts", method: "post", route: "/:ingestionId/retry" },
  {
    file: "packages/api/src/routes/v1/multi-source-reconciliation.ts",
    method: "post",
    route: "/jobs/:jobId/run",
  },
  {
    file: "packages/api/src/routes/v1/multi-source-reconciliation.ts",
    method: "post",
    route: "/conflicts/:conflictId/resolve",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/alerts/check",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/alerts/thresholds",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/cost-controls/usage-ceilings",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/cost-controls/job-limits",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/kill-switches",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/kill-switches/connectors/:connectorType/disable",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/kill-switches/connectors/:connectorType/enable",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/kill-switches/jobs/:jobType/pause",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/kill-switches/jobs/:jobType/resume",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/backups/create",
  },
  {
    file: "packages/api/src/routes/v1/operator-mode.ts",
    method: "post",
    route: "/operator/backups/:backupId/verify",
  },
  { file: "packages/api/src/routes/v1/receipt-matching.ts", method: "post", route: "/match" },
  {
    file: "packages/api/src/routes/v1/receipt-matching.ts",
    method: "post",
    route: "/links/:linkId/verify",
  },
  { file: "packages/api/src/routes/v1/reconciliation.ts", method: "post", route: "/run" },
  {
    file: "packages/api/src/routes/v1/reconciliation.ts",
    method: "patch",
    route: "/matches/:matchId",
  },
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeHasFreezeProtection(content: string, expectation: RouteExpectation) {
  const pattern = new RegExp(
    `router\\.${expectation.method}\\(\\s*["'\`]${escapeRegex(expectation.route)}["'\`][\\s\\S]{0,600}?enforceFreezeState\\(`,
    "m"
  );

  return pattern.test(content);
}

function main() {
  const root = process.cwd();
  const fileCache = new Map<string, string>();
  const failures: string[] = [];

  for (const expectation of EXPECTED_PROTECTED_ROUTES) {
    const absoluteFile = path.join(root, expectation.file);
    const content = fileCache.get(absoluteFile) ?? fs.readFileSync(absoluteFile, "utf8");

    fileCache.set(absoluteFile, content);

    if (!routeHasFreezeProtection(content, expectation)) {
      failures.push(
        `${expectation.file} :: ${expectation.method.toUpperCase()} ${expectation.route}`
      );
    }
  }

  if (failures.length > 0) {
    console.error("Freeze coverage verification failed.");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Freeze coverage verified for ${EXPECTED_PROTECTED_ROUTES.length} high-risk mutation routes.`
  );
}

main();
