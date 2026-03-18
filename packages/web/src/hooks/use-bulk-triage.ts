import { useState } from "react";

export function useBulkTriage() {
  const [filters, setFilters] = useState<any>({
    status: undefined,
    search: "",
  });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, _setError] = useState<Error | null>(null);

  const items = {
    selectedCount: 0,
    totalCount: 156,
    displayedCount: 50,
    page: 1,
    totalPages: 4,
    data: [
      {
        id: "tx_123",
        transactionId: "TRX-001",
        externalId: "ext-111",
        amount: "$1,250.00",
        date: "2026-02-18",
        sourceSystem: "ERP",
        status: "pending",
        selected: false,
      },
    ],
  };

  const refresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const applyAction = async (action: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    return true;
  };

  return {
    items,
    filters,
    setFilters,
    selectedAction,
    setSelectedAction,
    isLoading,
    error,
    _setError,
    refresh,
    applyAction,
  };
}
