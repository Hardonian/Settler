import React, { Suspense } from "react";
import AppPageLayout from "@/components/AppPageLayout";
import { getTenantContext } from "@/lib/tenant/server";
import { getOfflineWorkbenchSnapshot } from "@/lib/server/exceptions/reconciliation-workbench";
import { Workbench } from "@/components/console/Workbench";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
} from "@/lib/supabase/tenant-membership";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const [tenantContext, membershipScope] = await Promise.all([
    getTenantContext(),
    resolveTenantMembershipScope(),
  ]);
  const tenantId = resolveTenantForMutation(
    membershipScope.tenantIds,
    tenantContext.tenantId || null
  );
  const snapshot = await getOfflineWorkbenchSnapshot(tenantId);

  return (
    <ErrorBoundary context="Operator Workbench (/reconcile)">
      <Suspense fallback={<PageLoadingSkeleton />}>
        <AppPageLayout
          title="Operator Workbench"
          description={
            snapshot.mode === "offline_fixture"
              ? "Deterministic reconciliation intelligence and exception adjudication command surface (Local Mode)."
              : "Deterministic reconciliation intelligence and exception adjudication command surface."
          }
        >
          <Workbench />
        </AppPageLayout>
      </Suspense>
    </ErrorBoundary>
  );
}
