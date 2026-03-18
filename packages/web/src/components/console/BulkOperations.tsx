/**
 * Bulk Operations Component
 * Handles bulk operations on transactions, matches, etc.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, Play, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";

interface BulkOperation {
  id: string;
  operationType: string;
  targetType: string;
  status: string;
  progressPercentage: number;
  itemsProcessed: number;
  totalItems: number;
  succeededCount: number;
  failedCount: number;
  errorDetails: Array<{ itemId: string; error: string }>;
  createdAt: string;
  completedAt?: string;
}

export function BulkOperations() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [operationType, setOperationType] = useState<string>("");
  const [targetType, setTargetType] = useState<string>("");
  const { isFrozen, governanceState } = useGovernanceState();

  useEffect(() => {
    // In a real implementation, you'd fetch operations here
  }, []);

  const handleCreateOperation = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item");
      return;
    }

    if (!operationType || !targetType) {
      setError("Operation type and target type are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/v1/bulk-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationType,
          targetType,
          targetIds: selectedItems,
          operationConfig: {},
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create operation");
      }

      const data = await res.json();
      setOperations([...operations, data]);
      setSelectedItems([]);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create operation");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationStatus = async (operationId: string) => {
    try {
      const res = await fetch(`/api/v1/bulk-operations/${operationId}`);
      if (!res.ok) throw new Error("Failed to fetch status");

      const data = await res.json();
      setOperations(operations.map((op) => (op.id === operationId ? { ...op, ...data } : op)));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to fetch status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>Perform operations on multiple items at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label>Operation Type</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="correct">Correct</SelectItem>
                  <SelectItem value="link_receipts">Link Receipts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Type</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval_request">Approval Requests</SelectItem>
                  <SelectItem value="transaction">Transactions</SelectItem>
                  <SelectItem value="match">Matches</SelectItem>
                  <SelectItem value="receipt">Receipts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Selected Items ({selectedItems.length})</Label>
              <div className="border rounded p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No items selected. Select items from the list below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((itemId) => (
                      <div key={itemId} className="flex items-center justify-between text-sm">
                        <span className="font-mono">{itemId.slice(0, 8)}...</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedItems(selectedItems.filter((id) => id !== itemId))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <FreezeBlockedButton
              onClick={handleCreateOperation}
              disabled={loading || selectedItems.length === 0}
              isFrozen={isFrozen}
              freezeReason={governanceState?.freeze_reason}
              frozenMessage="Bulk operations blocked by tenant freeze"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute Bulk Operation
            </FreezeBlockedButton>
          </div>
        </CardContent>
      </Card>

      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operations.map((operation) => (
                <Card key={operation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold">
                          {operation.operationType} - {operation.targetType}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created {format(new Date(operation.createdAt), "MMM d, yyyy HH:mm")}
                        </div>
                      </div>
                      {getStatusBadge(operation.status)}
                    </div>

                    {operation.status === "running" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{operation.progressPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={operation.progressPercentage} />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Processed</div>
                        <div className="text-lg font-semibold">{operation.itemsProcessed}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Succeeded</div>
                        <div className="text-lg font-semibold text-green-600">
                          {operation.succeededCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                        <div className="text-lg font-semibold text-red-600">
                          {operation.failedCount}
                        </div>
                      </div>
                    </div>

                    {operation.errorDetails.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold mb-2">Errors:</div>
                        <div className="space-y-1">
                          {operation.errorDetails.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600">
                              {error.itemId}: {error.error}
                            </div>
                          ))}
                          {operation.errorDetails.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              +{operation.errorDetails.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {operation.status === "running" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => fetchOperationStatus(operation.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
