import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import { BulkTriageClient } from "@/components/workspace/BulkTriageClient";

export const dynamic = "force-dynamic";

export default function WorkspaceBulkTriagePage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton count={3} />}>
      <BulkTriageClient />
    </Suspense>
  );
}