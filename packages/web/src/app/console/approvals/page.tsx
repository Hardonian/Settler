import { ApprovalWorkflows } from "@/components/console/ApprovalWorkflows";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export default function ApprovalsPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Approval Workflows
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review pending approvals, manage workflow policies, and track approval history across
            your organization.
          </p>
        </div>
        <ApprovalWorkflows />
      </div>
    </ConsoleErrorBoundary>
  );
}
