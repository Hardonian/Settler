import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/shared/loading-state";
import { WorkspaceInvestigationDetailClient } from "@/components/workspace/WorkspaceInvestigationDetailClient";

export const dynamic = "force-dynamic";

export default function WorkspaceInvestigationDetailPage({
  params,
}: {
  params: { ingestionId: string };
}) {
  return (
    <Suspense fallback={<PageLoadingSkeleton count={3} />}>
      <WorkspaceInvestigationDetailClient ingestionId={params.ingestionId} />
    </Suspense>
  );
}
