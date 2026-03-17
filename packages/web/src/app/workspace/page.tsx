import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import { ReconciliationQueueClient } from "@/components/workspace/ReconciliationQueueClient";

export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton count={3} />}>
      <ReconciliationQueueClient />
    </Suspense>
  );
}