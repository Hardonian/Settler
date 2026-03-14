import { ReceiptMatching } from "@/components/console/ReceiptMatching";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export default function ReceiptMatchingPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Receipt Matching
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Match parsed receipts against transaction records. Review confidence scores and resolve
            discrepancies.
          </p>
        </div>
        <ReceiptMatching />
      </div>
    </ConsoleErrorBoundary>
  );
}
