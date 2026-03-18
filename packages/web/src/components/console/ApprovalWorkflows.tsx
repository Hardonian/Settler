/**
 * Approval Workflows Component
 * Handles approval requests and approver management
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, XCircle, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";

interface ApprovalRequest {
  id: string;
  requestedBy: string;
  approverId?: string;
  approverRole?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestType: string;
  requestDetails: Record<string, unknown>;
  comments?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
}

export function ApprovalWorkflows() {
  const { isFrozen, governanceState } = useGovernanceState();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    requestType: "",
    reconciliationRunId: "",
    approverId: "",
    comments: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/approvals/requests");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/v1/approvals/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: newRequest.requestType,
          requestDetails: {
            reconciliationRunId: newRequest.reconciliationRunId,
          },
          approverId: newRequest.approverId || undefined,
          comments: newRequest.comments || undefined,
          expiresInHours: 24,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create request");
      }

      setShowCreateForm(false);
      setNewRequest({ requestType: "", reconciliationRunId: "", approverId: "", comments: "" });
      await fetchRequests();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`/api/v1/approvals/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to approve");
      await fetchRequests();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to approve");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/v1/approvals/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: "Rejected" }),
      });

      if (!res.ok) throw new Error("Failed to reject");
      await fetchRequests();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to reject");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Workflows</CardTitle>
              <CardDescription>Manage approval requests and approvers</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <UserPlus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Approval Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Request Type</Label>
                  <Select
                    value={newRequest.requestType}
                    onValueChange={(value) => setNewRequest({ ...newRequest, requestType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reconciliation_finalize">
                        Finalize Reconciliation
                      </SelectItem>
                      <SelectItem value="bulk_correction">Bulk Correction</SelectItem>
                      <SelectItem value="export">Export Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reconciliation Run ID (optional)</Label>
                  <Input
                    value={newRequest.reconciliationRunId}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, reconciliationRunId: e.target.value })
                    }
                    placeholder="Enter run ID"
                  />
                </div>

                <div>
                  <Label>Approver ID (optional - auto-assigned if empty)</Label>
                  <Input
                    value={newRequest.approverId}
                    onChange={(e) => setNewRequest({ ...newRequest, approverId: e.target.value })}
                    placeholder="Enter approver ID"
                  />
                </div>

                <div>
                  <Label>Comments</Label>
                  <Textarea
                    value={newRequest.comments}
                    onChange={(e) => setNewRequest({ ...newRequest, comments: e.target.value })}
                    placeholder="Add comments..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRequest} disabled={loading}>
                    Create Request
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Approval Requests</h3>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No approval requests</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs">
                        {request.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{request.requestType}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{request.requestedBy.slice(0, 8)}...</TableCell>
                      <TableCell>
                        {request.approverId
                          ? request.approverId.slice(0, 8) + "..."
                          : "Auto-assign"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.requestedAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <FreezeBlockedButton
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request.id)}
                              isFrozen={isFrozen}
                              freezeReason={governanceState?.freeze_reason}
                              frozenMessage="Approvals blocked by tenant freeze"
                            >
                              Approve
                            </FreezeBlockedButton>
                            <FreezeBlockedButton
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              isFrozen={isFrozen}
                              freezeReason={governanceState?.freeze_reason}
                              frozenMessage="Approvals blocked by tenant freeze"
                            >
                              Reject
                            </FreezeBlockedButton>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
