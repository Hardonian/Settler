/**
 * AI Agent Orchestrator
 * 
 * Manages the lifecycle and coordination of all AI agents in Settler.
 */

import { EventEmitter } from 'events';

export interface AgentConfig {
  id: string;
  name: string;
  type: 'infrastructure' | 'anomaly' | 'synthetic' | 'support' | 'qa';
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AgentRequest {
  agentId: string;
  action: string;
  params: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AgentResponse {
  agentId: string;
  action: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
}

export abstract class BaseAgent extends EventEmitter {
  abstract id: string;
  abstract name: string;
  abstract type: AgentConfig['type'];
  
  protected config: AgentConfig['config'] = {};
  protected enabled: boolean = false;

  constructor(config: AgentConfig['config'] = {}) {
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
  abstract execute(action: string, params: Record<string, unknown>): Promise<unknown>;

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
    this.emit('enabled');
  }

  /**
   * Disable the agent
   */
  disable(): void {
    this.enabled = false;
    this.emit('disabled');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig['config']>): void {
    this.config = { ...this.config, ...config };
    this.emit('config_updated', this.config);
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
    agent.on('enabled', () => this.emit('agent_enabled', agent.id));
    agent.on('disabled', () => this.emit('agent_disabled', agent.id));
    this.emit('agent_registered', agent.id);
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
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      enabled: (agent as any).enabled,
      config: agent['config'],
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

    if (!(agent as any).enabled) {
      throw new Error(`Agent ${request.agentId} is not enabled`);
    }

    const startTime = Date.now();

    try {
      const data = await agent.execute(request.action, request.params);
      const executionTime = Date.now() - startTime;

      return {
        agentId: request.agentId,
        action: request.action,
        success: true,
        data,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        agentId: request.agentId,
        action: request.action,
        success: false,
        error: error.message,
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
          this.emit('request_completed', response);
        } catch (error) {
          this.emit('request_failed', { request, error });
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Initialize all agents
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.agents.values()).map(agent => 
      agent.initialize().catch(error => {
        console.error(`Failed to initialize agent ${agent.id}:`, error);
      })
    );

    await Promise.all(initPromises);
    this.emit('all_agents_initialized');
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
      enabledAgents: Array.from(this.agents.values()).filter(a => (a as any).enabled).length,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
