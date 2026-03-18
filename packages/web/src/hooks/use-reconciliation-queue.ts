import { useState } from "react";

export function useReconciliationQueue() {
  const [filters, setFilters] = useState<any>({
    status: undefined,
    search: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queue = {
    totalRuns: 42,
    activeRuns: 3,
    completedToday: 15,
    failedRuns: 1,
    recentRuns: [
      {
        id: "run_888",
        status: "Completed",
        startTime: "10:30 AM",
        records: 4500,
        matches: 4492,
        mismatches: 8,
      },
      {
        id: "run_889",
        status: "Processing",
        startTime: "11:15 AM",
        records: 1200,
        matches: 1100,
        mismatches: 100,
      },
    ],
  };

  const refresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const startReconciliation = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    return true;
  };

  return {
    queue,
    filters,
    setFilters,
    isLoading,
    error,
    refresh,
    startReconciliation,
  };
}
