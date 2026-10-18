/**
 * Agent Governance & Draft Approval Service
 *
 * Implements human-in-the-loop review, cryptographic policy token signing,
 * and tenant-isolated execution authorization for autonomous AI agent drafts.
 */

import {
  AgentJobDraft,
  agentOrchestrator,
  assertSignedPolicyToken,
  createSignedPolicyToken,
  policyPayloadHash,
} from "./orchestrator";
import { logInfo, logWarn } from "../../utils/logger";

export interface StoredAgentDraft extends AgentJobDraft {
  id: string;
  tenantId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  executionResult?: unknown;
  mathematicalEvidence?: {
    formula: string;
    inputs: Record<string, number | string>;
    expectedDelta: number;
    actualDelta: number;
    varianceZeroProof: boolean;
  };
}

export interface PolicyTokenClaims {
  tenantId: string;
  agentId: string;
  draftId: string;
  approverId: string;
  approverRole: string;
  signedAt: number;
  payloadHash: string;
}

function executionActionForAgent(agentId: string): string {
  const actions: Record<string, string> = {
    "infrastructure-optimizer": "optimize",
    "anomaly-detector": "apply_remediation",
    "synthetic-user-simulator": "run_simulation",
    "support-copilot": "execute_resolution",
    "release-qa-agent": "promote_release",
  };
  const action = actions[agentId];
  if (!action) {
    throw new Error(`No governed execution action registered for agent ${agentId}`);
  }
  return action;
}

export class AgentGovernanceService {
  // Tenant-scoped drafts storage: Map<tenantId, Map<draftId, StoredAgentDraft>>
  private tenantDrafts: Map<string, Map<string, StoredAgentDraft>> = new Map();
  private attachedAgents = new Set<string>();

  constructor() {
    this.listenToAgentDrafts();
    agentOrchestrator.on("agent_registered", (agentId: string) => this.attachAgent(agentId));
  }

  private listenToAgentDrafts(): void {
    for (const config of agentOrchestrator.listAgents()) {
      this.attachAgent(config.id);
    }
  }

  private attachAgent(agentId: string): void {
    if (this.attachedAgents.has(agentId)) return;
    const agent = agentOrchestrator.getAgent(agentId);
    if (!agent) return;

    agent.on("draft_job_created", (draft: AgentJobDraft) => {
      const tenantId = draft.payload?.tenantId;
      if (typeof tenantId !== "string" || tenantId.length === 0) {
        logWarn(`Rejected unscoped AI agent draft from ${draft.agentId}`);
        return;
      }
      this.recordDraft(tenantId, draft);
    });
    this.attachedAgents.add(agentId);
  }

  /**
   * Generates a cryptographically signed policy token
   */
  signPolicyToken(claims: PolicyTokenClaims): string {
    const issuedAt = Math.floor(claims.signedAt / 1000);
    return createSignedPolicyToken(
      {
        tenantId: claims.tenantId,
        agentId: claims.agentId,
        action: executionActionForAgent(claims.agentId),
        payloadHash: claims.payloadHash,
      },
      `${claims.draftId}:${claims.approverId}`,
      issuedAt,
      issuedAt + 900
    );
  }

  /**
   * Verifies that a policy token is valid, matches the claims, and has not expired
   */
  verifyPolicyToken(token: string, claims: Omit<PolicyTokenClaims, "signedAt">): boolean {
    try {
      assertSignedPolicyToken(token, {
        tenantId: claims.tenantId,
        agentId: claims.agentId,
        action: executionActionForAgent(claims.agentId),
        payloadHash: claims.payloadHash,
        nonce: `${claims.draftId}:${claims.approverId}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Records a new draft job for a tenant
   */
  recordDraft(
    tenantId: string,
    draft: AgentJobDraft,
    mathEvidence?: StoredAgentDraft["mathematicalEvidence"]
  ): StoredAgentDraft {
    if (!this.tenantDrafts.has(tenantId)) {
      this.tenantDrafts.set(tenantId, new Map());
    }
    const tenantStore = this.tenantDrafts.get(tenantId)!;

    const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const storedDraft: StoredAgentDraft = {
      ...draft,
      id,
      tenantId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...(mathEvidence ? { mathematicalEvidence: mathEvidence } : {}),
    };

    tenantStore.set(id, storedDraft);
    logInfo(`Recorded AI agent draft job ${id} for tenant ${tenantId}`, {
      agentId: draft.agentId,
      jobType: draft.jobType,
    });

    return storedDraft;
  }

  /**
   * Lists all drafts for a tenant with optional filtering
   */
  listDrafts(
    tenantId: string,
    filter?: {
      status?: "pending" | "approved" | "rejected";
      agentId?: string;
    }
  ): StoredAgentDraft[] {
    const tenantStore = this.tenantDrafts.get(tenantId);
    if (!tenantStore) return [];

    let drafts = Array.from(tenantStore.values());

    if (filter?.status) {
      drafts = drafts.filter((d) => d.status === filter.status);
    }
    if (filter?.agentId) {
      drafts = drafts.filter((d) => d.agentId === filter.agentId);
    }

    return drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves a specific draft by ID within tenant context
   */
  getDraft(tenantId: string, draftId: string): StoredAgentDraft | null {
    const tenantStore = this.tenantDrafts.get(tenantId);
    return tenantStore?.get(draftId) || null;
  }

  /**
   * Approves a draft job, signs policy token, and dispatches execution to the agent
   */
  async approveDraft(
    tenantId: string,
    draftId: string,
    approver: { id: string; role: string }
  ): Promise<{
    draft: StoredAgentDraft;
    policyToken: string;
    executionResult: unknown;
  }> {
    const draft = this.getDraft(tenantId, draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found for tenant`);
    }

    if (draft.status !== "pending") {
      throw new Error(`Draft ${draftId} cannot be approved from status '${draft.status}'`);
    }

    const agent = agentOrchestrator.getAgent(draft.agentId);
    if (!agent) {
      throw new Error(`Agent ${draft.agentId} is not registered`);
    }

    const now = Date.now();
    const policyNonce = `${draft.id}:${approver.id}`;
    const executionParams = { ...draft.payload, policyNonce };
    const policyToken = this.signPolicyToken({
      tenantId,
      agentId: draft.agentId,
      draftId: draft.id,
      approverId: approver.id,
      approverRole: approver.role,
      signedAt: now,
      payloadHash: policyPayloadHash(executionParams),
    });

    draft.status = "approved";
    draft.approvedAt = new Date(now).toISOString();
    draft.approvedBy = approver.id;
    draft.updatedAt = draft.approvedAt;
    draft.policyToken = policyToken;

    // Dispatch execution to the target agent under signed policy token
    let executionResult: unknown = null;

    try {
      logInfo(`Executing approved agent draft ${draft.id} with signed policy token`);
      const action = executionActionForAgent(draft.agentId);
      executionResult = await agent.execute(
        action,
        {
          ...executionParams,
          policyToken,
        },
        { tenantId, userId: approver.id }
      );
    } catch (err: unknown) {
      logWarn(`Agent ${draft.agentId} execution failed: ${err}`);
      executionResult = {
        executedUnderPolicy: false,
        status: "execution_failed",
        timestamp: new Date().toISOString(),
      };
    }

    draft.executionResult = executionResult;
    logInfo(`Successfully approved and executed AI draft ${draftId}`, {
      approverId: approver.id,
    });

    return { draft, policyToken, executionResult };
  }

  /**
   * Rejects a draft job with reason
   */
  rejectDraft(
    tenantId: string,
    draftId: string,
    approverId: string,
    reason: string
  ): StoredAgentDraft {
    const draft = this.getDraft(tenantId, draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found for tenant`);
    }

    if (draft.status !== "pending") {
      throw new Error(`Draft ${draftId} is already finalized (${draft.status})`);
    }

    const now = new Date().toISOString();
    draft.status = "rejected";
    draft.rejectedAt = now;
    draft.rejectedBy = approverId;
    draft.rejectionReason = reason;
    draft.updatedAt = now;

    logInfo(`Rejected AI agent draft job ${draftId} by ${approverId}`, {
      reason,
    });
    return draft;
  }
}

export const agentGovernanceService = new AgentGovernanceService();
