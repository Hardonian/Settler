import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import { WorkspaceInvestigationClient } from "@/components/workspace/WorkspaceInvestigationClient";

export const dynamic = "force-dynamic";

export default function WorkspaceInvestigationPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton count={3} />}>
      <WorkspaceInvestigationClient />
    </Suspense>
  );
}