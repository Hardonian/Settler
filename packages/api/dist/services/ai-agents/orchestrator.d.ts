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
export declare abstract class BaseAgent extends EventEmitter {
    abstract id: string;
    abstract name: string;
    abstract type: AgentConfig['type'];
    protected config: AgentConfig['config'];
    protected enabled: boolean;
    constructor(config?: AgentConfig['config']);
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
    enable(): void;
    /**
     * Disable the agent
     */
    disable(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<AgentConfig['config']>): void;
}
export declare class AgentOrchestrator extends EventEmitter {
    private agents;
    private requestQueue;
    private isProcessing;
    /**
     * Register an agent
     */
    registerAgent(agent: BaseAgent): void;
    /**
     * Get an agent by ID
     */
    getAgent(agentId: string): BaseAgent | undefined;
    /**
     * List all agents
     */
    listAgents(): AgentConfig[];
    /**
     * Execute an agent action
     */
    execute(request: AgentRequest): Promise<AgentResponse>;
    /**
     * Queue a request for processing
     */
    queueRequest(request: AgentRequest): void;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Initialize all agents
     */
    initializeAll(): Promise<void>;
    /**
     * Get orchestrator stats
     */
    getStats(): {
        totalAgents: number;
        enabledAgents: number;
        queueLength: number;
        isProcessing: boolean;
    };
}
export declare const agentOrchestrator: AgentOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map