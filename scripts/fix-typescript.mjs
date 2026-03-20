/**
 * Fix TypeScript errors in packages/web
 * Run with: node scripts/fix-typescript.mjs
 */

import fs from "fs";
import path from "path";

const WEB = "packages/web/src";

// ========================================
// Fix 1: ArrowRight import in api-keys/page.tsx
// ========================================
{
  const filePath = path.join(WEB, "app/console/api-keys/page.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // Find and replace the lucide-react import to add ArrowRight
  const oldImport = `ExternalLink,
  Code,
} from "lucide-react";`;
  const newImport = `ExternalLink,
  Code,
  ArrowRight,
} from "lucide-react";`;

  content = content.replace(oldImport, newImport);
  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed ArrowRight import in api-keys/page.tsx");
}

// ========================================
// Fix 2: Export RunListItem from runs-reader (already done)
// ========================================

// ========================================
// Fix 3: RunSummary type in run-status.ts - make extra fields optional
// ========================================
{
  const filePath = path.join(WEB, "lib/reconciliation/run-status.ts");
  let content = fs.readFileSync(filePath, "utf8");

  // Update the RunSummary interface to make extra fields optional
  const oldInterface = `export interface RunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  // Canonical contract fields
  processed: number;
  matched: number;
  matchedWithTolerance: number;
  unmatched: number;
  mismatched: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
  // Extended fields from canonical
  exceptioned: number;
  unresolved: number;
  resolved: number;
  ignored: number;
}`;

  const newInterface = `export interface RunSummary {
  total: number;
  sourceCount: number;
  targetCount: number;
  // Canonical contract fields
  processed?: number;
  matched: number;
  matchedWithTolerance?: number;
  unmatched: number;
  mismatched?: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflicts: number;
  // Extended fields from canonical
  exceptioned?: number;
  unresolved?: number;
  resolved?: number;
  ignored?: number;
}`;

  content = content.replace(oldInterface, newInterface);
  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed RunSummary type in run-status.ts");
}

// ========================================
// Fix 4: mismatched -> mismatches in ReconciliationView.tsx
// ========================================
{
  const filePath = path.join(WEB, "components/console/ReconciliationView.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(/summary\.mismatched/g, "summary.mismatches");
  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed mismatched -> mismatches in ReconciliationView.tsx");
}

// ========================================
// Fix 5: mismatched -> mismatches in ReconciliationQueueClient.tsx
// ========================================
{
  const filePath = path.join(WEB, "components/workspace/ReconciliationQueueClient.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  content = content.replace(/run\.mismatched/g, "run.mismatches");
  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed mismatched -> mismatches in ReconciliationQueueClient.tsx");
}

// ========================================
// Fix 6: empty-state href - remove href prop usage
// ========================================
{
  const filePath = path.join(WEB, "components/shared/empty-state.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // The href prop is being passed to action but doesn't exist in EmptyStateProps
  // Fix: Use onClick with router.push instead of href
  const oldAction = `action={actionLabel && actionHref ? {
        label: actionLabel,
        onClick: () => {},
        href: actionHref,
      } : undefined}`;
  const newAction = `action={actionLabel && actionHref ? {
        label: actionLabel,
        onClick: () => { window.location.href = actionHref; },
      } : undefined}`;

  content = content.replace(oldAction, newAction);
  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed empty-state href in shared/empty-state.tsx");
}

// ========================================
// Fix 7: Add null checks for run.confidence and run.matched_records
// ========================================
{
  const filePath = path.join(WEB, "app/app/runs/page.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // Replace run.matched_records with run.matched_records ?? 0
  content = content.replace(
    /run\.matched_records\.toLocaleString\(\)/g,
    "(run.matched_records ?? 0).toLocaleString()"
  );

  // Replace run.confidence * 100 with (run.confidence ?? 1) * 100
  content = content.replace(/run\.confidence \* 100/g, "(run.confidence ?? 1) * 100");

  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed null checks for run.confidence and run.matched_records");
}

// ========================================
// Fix 8: HealthStatus type in operator/page.tsx
// ========================================
{
  const filePath = path.join(WEB, "app/console/operator/page.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // The healthData.status is "healthy" which needs to be narrowed properly
  // Cast the status to the expected type
  content = content.replace(
    /const healthData = \{/g,
    `const healthData: { status: "healthy" | "degraded" | "unhealthy"; checks: Record<string, { status: string; latency?: number; timestamp: string }>; timestamp: string } = {`
  );

  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed HealthStatus type in operator/page.tsx");
}

// ========================================
// Fix 9: SetStateAction type in playground/reconcile/page.tsx
// ========================================
{
  const filePath = path.join(WEB, "app/console/playground/reconcile/page.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // Fix the setLogs type issue
  content = content.replace(
    /setLogs\(prev => \[\.\.\.prev, logMessages\[logIndex\\]\]\);/g,
    `setLogs(prev => [...prev, logMessages[logIndex] ?? '']);`
  );

  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed SetStateAction type in playground/reconcile/page.tsx");
}

// ========================================
// Fix 10: SecureMobileApp style jsx global issue
// ========================================
{
  const filePath = path.join(WEB, "components/SecureMobileApp.tsx");
  let content = fs.readFileSync(filePath, "utf8");

  // Fix the style jsx global - should use a different approach
  content = content.replace(/<style jsx global>/g, "<style jsx>{`");
  content = content.replace(/<\/style>/g, "`}</style>");

  fs.writeFileSync(filePath, content);
  console.log("✓ Fixed SecureMobileApp style issue");
}

console.log("\n✅ All TypeScript fixes applied!");
