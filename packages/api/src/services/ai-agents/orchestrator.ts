/**
 * AI Agent Orchestrator
 *
 * Manages the lifecycle and coordination of all AI agents in Settler.
 */

import { EventEmitter } from "events";
import { createHmac, timingSafeEqual } from "node:crypto";
import { canonicalSha256 } from "@settler/proofs";
import { logError } from "../../utils/logger";

export interface AgentConfig {
  id: string;
  name: string;
  type: "infrastructure" | "anomaly" | "synthetic" | "support" | "qa";
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AgentRequest {
  agentId: string;
  action: string;
  params: Record<string, unknown>;
  context?: AgentExecutionContext;
}

export interface AgentExecutionContext {
  tenantId: string;
  userId?: string | null;
  traceId?: string | null;
}

export interface AgentResponse {
  agentId: string;
  action: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
}

/**
 * Strict draft-only job request contract for AI agent autonomous operations.
 * Bounded by mathematical limits; direct mutations or fund transfers are prohibited without human approval.
 */
export interface AgentJobDraft {
  agentId: string;
  jobType: string;
  payload: Record<string, unknown>;
  autoExecute: false;
  requireApproval: true;
  policyToken?: string;
  governance: {
    riskLevel: "low" | "medium" | "high";
    estimatedImpact: string;
    requiresHumanReview: true;
    signedPolicyBound: string;
  };
}

/**
 * Enforces policy token verification before allowing any high-privilege execution
 */
interface PolicyTokenClaims {
  version: 1;
  tenantId: string;
  agentId: string;
  action: string;
  payloadHash: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface ExpectedPolicyBounds {
  tenantId: string;
  agentId: string;
  action: string;
  payloadHash: string;
  nonce?: string;
}

export function policyPayloadHash(params: Record<string, unknown>): string {
  const { policyToken: _policyToken, ...payload } = params;
  void _policyToken;
  const jsonValue = JSON.parse(JSON.stringify(payload)) as unknown;
  return canonicalSha256(jsonValue);
}

function governanceViolation(): never {
  throw new Error(
    "GOVERNANCE_INVARIANT_VIOLATION: Direct execution forbidden without verified signed policy token"
  );
}

function policyTokenSecret(): string {
  const secret = process.env.AGENT_POLICY_TOKEN_SECRET ?? process.env.POLICY_TOKEN_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    return governanceViolation();
  }
  return secret;
}

export function createSignedPolicyToken(
  bounds: ExpectedPolicyBounds,
  nonce: string,
  issuedAt = Math.floor(Date.now() / 1000),
  expiresAt = issuedAt + 900
): string {
  if (nonce.length < 16 || expiresAt <= issuedAt || expiresAt - issuedAt > 900) {
    return governanceViolation();
  }
  const claims: PolicyTokenClaims = {
    version: 1,
    ...bounds,
    issuedAt,
    expiresAt,
    nonce,
  };
  const payloadSegment = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signatureSegment = createHmac("sha256", policyTokenSecret())
    .update(`pt_v1.${payloadSegment}`, "utf8")
    .digest("base64url");
  return `pt_v1.${payloadSegment}.${signatureSegment}`;
}

export function assertSignedPolicyToken(
  policyToken: string | undefined,
  expected: ExpectedPolicyBounds
): PolicyTokenClaims {
  if (!policyToken) {
    return governanceViolation();
  }
  const secret = policyTokenSecret();

  const segments = policyToken.split(".");
  if (segments.length !== 3 || segments[0] !== "pt_v1") {
    return governanceViolation();
  }

  const payloadSegment = segments[1]!;
  const signatureSegment = segments[2]!;
  const expectedSignature = createHmac("sha256", secret)
    .update(`pt_v1.${payloadSegment}`, "utf8")
    .digest();

  let suppliedSignature: Buffer;
  let claims: PolicyTokenClaims;
  try {
    suppliedSignature = Buffer.from(signatureSegment, "base64url");
    claims = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch {
    return governanceViolation();
  }

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return governanceViolation();
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    claims.version !== 1 ||
    claims.tenantId !== expected.tenantId ||
    claims.agentId !== expected.agentId ||
    claims.action !== expected.action ||
    claims.payloadHash !== expected.payloadHash ||
    (expected.nonce !== undefined && claims.nonce !== expected.nonce) ||
    !Number.isSafeInteger(claims.issuedAt) ||
    !Number.isSafeInteger(claims.expiresAt) ||
    claims.issuedAt > now + 30 ||
    claims.expiresAt <= now ||
    claims.expiresAt - claims.issuedAt > 900 ||
    typeof claims.nonce !== "string" ||
    claims.nonce.length < 16
  ) {
    return governanceViolation();
  }

  return claims;
}

export abstract class BaseAgent extends EventEmitter {
  abstract id: string;
  abstract name: string;
  abstract type: AgentConfig["type"];

  protected config: AgentConfig["config"] = {};
  protected enabled: boolean = false;

  constructor(config: AgentConfig["config"] = {}) {
    super();
    this.config = config;
  }

  /**
   * Initialize the agent
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute an action
   */
  abstract execute(
    action: string,
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<unknown>;

  /**
   * Get agent status
   */
  abstract getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }>;

  /**
   * Enable the agent
   */
  enable(): void {
    this.enabled = true;
    this.emit("enabled");
  }

  /**
   * Disable the agent
   */
  disable(): void {
    this.enabled = false;
    this.emit("disabled");
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig["config"]>): void {
    this.config = { ...this.config, ...config };
    this.emit("config_updated", this.config);
  }
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private requestQueue: AgentRequest[] = [];
  private isProcessing = false;

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    agent.on("enabled", () => this.emit("agent_enabled", agent.id));
    agent.on("disabled", () => this.emit("agent_disabled", agent.id));
    this.emit("agent_registered", agent.id);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      enabled: (agent as BaseAgent & { enabled: boolean }).enabled,
      config: agent["config"],
    }));
  }

  /**
   * Execute an agent action
   */
  async execute(request: AgentRequest): Promise<AgentResponse> {
    const agent = this.agents.get(request.agentId);

    if (!agent) {
      throw new Error(`Agent ${request.agentId} not found`);
    }

    if (!(agent as BaseAgent & { enabled: boolean }).enabled) {
      throw new Error(`Agent ${request.agentId} is not enabled`);
    }

    const startTime = Date.now();

    try {
      const data = await agent.execute(request.action, request.params, request.context);
      const executionTime = Date.now() - startTime;

      return {
        agentId: request.agentId,
        action: request.action,
        success: true,
        data,
        executionTime,
      };
    } catch (error: unknown) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        agentId: request.agentId,
        action: request.action,
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Queue a request for processing
   */
  queueRequest(request: AgentRequest): void {
    this.requestQueue.push(request);
    this.processQueue();
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          const response = await this.execute(request);
          this.emit("request_completed", response);
        } catch (error) {
          this.emit("request_failed", { request, error });
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Initialize all agents
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.agents.values()).map((agent) =>
      agent.initialize().catch((error) => {
        logError(`Failed to initialize agent ${agent.id}`, error);
      })
    );

    await Promise.all(initPromises);
    this.emit("all_agents_initialized");
  }

  /**
   * Get orchestrator stats
   */
  getStats(): {
    totalAgents: number;
    enabledAgents: number;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      totalAgents: this.agents.size,
      enabledAgents: Array.from(this.agents.values()).filter(
        (a) => (a as BaseAgent & { enabled: boolean }).enabled
      ).length,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
