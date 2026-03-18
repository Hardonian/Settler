import { useState } from "react";

export function useWorkspaceInvestigation() {
  const [filters, setFilters] = useState<any>({
    status: undefined,
    search: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, _setError] = useState<Error | null>(null);

  const investigation = {
    id: "123",
    status: "Active",
    description: "Reconciliation of February 2026 payroll data",
    totalTransactions: 1000,
    matchedTransactions: 800,
    mismatchedTransactions: 150,
    requiresReviewTransactions: 50,
    matchingRulesCount: 12,
    autoMatchedCount: 750,
    manualReviewCount: 200,
  };

  const refresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  return {
    investigation,
    filters,
    setFilters,
    isLoading,
    error,
    _setError,
    refresh,
  };
}
