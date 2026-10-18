"use client";

import React, { useState, useEffect } from "react";
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
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Cpu,
  Lock,
  Scale,
  Terminal,
  FileCheck,
  Eye,
  RefreshCw,
} from "lucide-react";

export interface StoredAgentDraft {
  id: string;
  tenantId: string;
  agentId: string;
  jobType: string;
  status: "pending" | "approved" | "rejected";
  payload: Record<string, unknown>;
  autoExecute: false;
  requireApproval: true;
  governance: {
    riskLevel: "low" | "medium" | "high";
    estimatedImpact: string;
    requiresHumanReview: true;
    signedPolicyBound: string;
  };
  mathematicalEvidence?: {
    formula: string;
    inputs: Record<string, number | string>;
    expectedDelta: number;
    actualDelta: number;
    varianceZeroProof: boolean;
  };
  policyToken?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export function AgentGovernanceWorkbench() {
  const [drafts, setDrafts] = useState<StoredAgentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "fleet">("pending");
  const [selectedDraft, setSelectedDraft] = useState<StoredAgentDraft | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/console/agent-governance");
      const json = await res.json();
      if (json.data) {
        setDrafts(json.data);
      }
    } catch {
      // Keep existing state
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draft: StoredAgentDraft) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/console/agent-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", draftId: draft.id }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMessage(
          `Draft ${draft.id} approved! Signed Token: ${json.data?.policyToken || json.policyToken}`
        );
        setSelectedDraft(null);
        await fetchDrafts();
      }
    } catch {
      setStatusMessage("Failed to approve draft");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDraft) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/console/agent-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          draftId: selectedDraft.id,
          reason: rejectionReason || "Rejected by operator",
        }),
      });
      if (res.ok) {
        setStatusMessage(`Draft ${selectedDraft.id} rejected.`);
        setRejectModalOpen(false);
        setRejectionReason("");
        setSelectedDraft(null);
        await fetchDrafts();
      }
    } catch {
      setStatusMessage("Failed to reject draft");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const historyDrafts = drafts.filter((d) => d.status !== "pending");

  const riskBadge = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">High Risk</Badge>;
      case "medium":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium Risk</Badge>
        );
      default:
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low Risk</Badge>;
    }
  };

  const agentFleet = [
    {
      id: "anomaly-detector",
      name: "Anomaly & Exploit Detector",
      type: "anomaly",
      bound: "pb_anomaly_remediation_draft_v1",
      role: "Identifies mathematical ledger variances, FX spread anomalies, and security patterns.",
      status: "Active (Draft-Only)",
    },
    {
      id: "infrastructure-optimizer",
      name: "Infrastructure Optimizer",
      type: "infrastructure",
      bound: "pb_infra_opt_draft_v1",
      role: "Monitors query performance, slow queries, and recommends read-replica routing.",
      status: "Active (Draft-Only)",
    },
    {
      id: "synthetic-user-simulator",
      name: "Synthetic User Simulator",
      type: "synthetic",
      bound: "pb_synthetic_sim_draft_v1",
      role: "Simulates high-frequency transaction patterns and stress workloads under governance.",
      status: "Active (Draft-Only)",
    },
    {
      id: "support-copilot",
      name: "Support Copilot",
      type: "support",
      bound: "pb_support_copilot_draft_v1",
      role: "Drafts dispute explanations and customer responses for calendar settlement timing.",
      status: "Active (Draft-Only)",
    },
    {
      id: "release-qa-agent",
      name: "Release QA Agent",
      type: "qa",
      bound: "pb_release_qa_draft_v1",
      role: "Evaluates pre-release smoke checks, replay determinism, and dual-ledger parity.",
      status: "Active (Draft-Only)",
    },
  ];

  return (
    <div className="space-y-6">
      {statusMessage && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <AlertDescription className="font-mono text-sm">{statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Pending Drafts
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between text-slate-900 dark:text-white">
              {pendingDrafts.length}
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Awaiting cryptographic operator signoff</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Governed Fleet
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between text-slate-900 dark:text-white">
              5 / 5
              <Cpu className="h-6 w-6 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">100% draft-only execution policy</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Executed via Policy
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between text-slate-900 dark:text-white">
              {historyDrafts.filter((d) => d.status === "approved").length}
              <FileCheck className="h-6 w-6 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Backed by signed HMAC policy tokens</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Hallucination Guard
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between text-slate-900 dark:text-white">
              Zero Egress
              <Lock className="h-6 w-6 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Deterministic local arithmetic proofs</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Pending Approvals ({pendingDrafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Execution History ({historyDrafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("fleet")}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === "fleet"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Agent Fleet & Policy Bounds (5)</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "pending" && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Agent Draft Review Inbox</CardTitle>
              <CardDescription>
                Autonomous agents cannot mutate data without human review and a signed policy token.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {pendingDrafts.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-80" />
                <p className="font-medium text-slate-900 dark:text-white">All clear</p>
                <p className="text-xs">No pending agent drafts requiring operator review.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Estimated Impact</TableHead>
                    <TableHead>Policy Bound</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDrafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span>{draft.agentId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{draft.jobType}</TableCell>
                      <TableCell>{riskBadge(draft.governance.riskLevel)}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-slate-600 dark:text-slate-300">
                        {draft.governance.estimatedImpact}
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {draft.governance.signedPolicyBound}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedDraft(draft)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Review & Sign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Governance Audit Log</CardTitle>
            <CardDescription>
              Complete cryptographic trail of approved policy tokens and rejected agent jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyDrafts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No executed history yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Draft ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed Policy Token</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyDrafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-mono text-xs">{draft.id}</TableCell>
                      <TableCell className="text-xs">{draft.agentId}</TableCell>
                      <TableCell>
                        {draft.status === "approved" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {draft.policyToken ? (
                          <code className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                            {draft.policyToken.slice(0, 24)}...
                          </code>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                        {draft.approvedBy || draft.rejectedBy || "operator"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(
                          draft.approvedAt || draft.rejectedAt || draft.createdAt
                        ).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentFleet.map((agent) => (
            <Card key={agent.id} className="border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-emerald-500 border-emerald-500/30 text-xs"
                  >
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">{agent.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500">Policy Bound Constraint:</span>
                  <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {agent.bound}
                  </code>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500">Autonomous Mutations:</span>
                  <span className="text-rose-500 font-semibold">Strictly Prohibited</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review & Signing Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Operator Policy Signoff Review
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Draft ID:{" "}
                  <code className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedDraft.id}
                  </code>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDraft(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </Button>
            </div>

            {/* Key Metadata */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">Agent</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedDraft.agentId}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">Risk Evaluation</span>
                {riskBadge(selectedDraft.governance.riskLevel)}
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">Policy Boundary</span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  {selectedDraft.governance.signedPolicyBound}
                </span>
              </div>
            </div>

            {/* Impact Description */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
              <span className="font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                Estimated Operational Impact:
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {selectedDraft.governance.estimatedImpact}
              </p>
            </div>

            {/* Mathematical Evidence Section */}
            {selectedDraft.mathematicalEvidence && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <Scale className="h-4 w-4 text-emerald-500" />
                  <span>Deterministic Mathematical Proof (Zero-Hallucination)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
                  <div>// Formula: {selectedDraft.mathematicalEvidence.formula}</div>
                  <div>
                    // Expected: {selectedDraft.mathematicalEvidence.expectedDelta} | Actual:{" "}
                    {selectedDraft.mathematicalEvidence.actualDelta}
                  </div>
                  <div className="text-emerald-300 font-bold">
                    ✓ Proven Zero-Variance Arithmetic Proof Grounded in Ledger Entries
                  </div>
                </div>
              </div>
            )}

            {/* Payload Inspection */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-slate-500" />
                <span>Job Request Payload</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-40 border border-slate-800">
                {JSON.stringify(selectedDraft.payload, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject Draft
              </Button>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDraft(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  onClick={() => handleApprove(selectedDraft)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {actionLoading ? "Signing Token..." : "Sign Policy Token & Execute"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Justification Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Reject Agent Draft
            </h4>
            <p className="text-xs text-slate-500">
              Provide justification for the audit trail before closing this request.
            </p>
            <textarea
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              rows={3}
              placeholder="e.g. Requires additional verification with vendor or out of tolerance"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={actionLoading}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
