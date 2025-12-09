"use strict";
/**
 * AI Agent Orchestrator
 *
 * Manages the lifecycle and coordination of all AI agents in Settler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentOrchestrator = exports.AgentOrchestrator = exports.BaseAgent = void 0;
const events_1 = require("events");
class BaseAgent extends events_1.EventEmitter {
    config = {};
    enabled = false;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    /**
     * Enable the agent
     */
    enable() {
        this.enabled = true;
        this.emit('enabled');
    }
    /**
     * Disable the agent
     */
    disable() {
        this.enabled = false;
        this.emit('disabled');
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.emit('config_updated', this.config);
    }
}
exports.BaseAgent = BaseAgent;
class AgentOrchestrator extends events_1.EventEmitter {
    agents = new Map();
    requestQueue = [];
    isProcessing = false;
    /**
     * Register an agent
     */
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        agent.on('enabled', () => this.emit('agent_enabled', agent.id));
        agent.on('disabled', () => this.emit('agent_disabled', agent.id));
        this.emit('agent_registered', agent.id);
    }
    /**
     * Get an agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * List all agents
     */
    listAgents() {
        return Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            enabled: agent.enabled,
            config: agent['config'],
        }));
    }
    /**
     * Execute an agent action
     */
    async execute(request) {
        const agent = this.agents.get(request.agentId);
        if (!agent) {
            throw new Error(`Agent ${request.agentId} not found`);
        }
        if (!agent.enabled) {
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
        }
        catch (error) {
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
    queueRequest(request) {
        this.requestQueue.push(request);
        this.processQueue();
    }
    /**
     * Process queued requests
     */
    async processQueue() {
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
                }
                catch (error) {
                    this.emit('request_failed', { request, error });
                }
            }
        }
        this.isProcessing = false;
    }
    /**
     * Initialize all agents
     */
    async initializeAll() {
        const initPromises = Array.from(this.agents.values()).map(agent => agent.initialize().catch(error => {
            console.error(`Failed to initialize agent ${agent.id}:`, error);
        }));
        await Promise.all(initPromises);
        this.emit('all_agents_initialized');
    }
    /**
     * Get orchestrator stats
     */
    getStats() {
        return {
            totalAgents: this.agents.size,
            enabledAgents: Array.from(this.agents.values()).filter(a => a.enabled).length,
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessing,
        };
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
exports.agentOrchestrator = new AgentOrchestrator();
//# sourceMappingURL=orchestrator.js.map