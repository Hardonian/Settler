"use strict";
/**
 * MCP (Model Context Protocol) Server Integration
 * Enables React.Settler to work with MCP-compatible tools and AI assistants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactSettlerMCPServer = void 0;
exports.createMCPServer = createMCPServer;
const licensing_1 = require("../utils/licensing");
/**
 * MCP Server for React.Settler
 * Exposes reconciliation workflows as MCP resources and tools
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
class ReactSettlerMCPServer {
    config;
    workflows = new Map();
    constructor(config) {
        (0, licensing_1.requireFeature)(licensing_1.FEATURE_FLAGS.MCP_INTEGRATION, 'MCP Server Integration');
        this.config = config;
    }
    /**
     * Register a reconciliation workflow
     */
    registerWorkflow(id, config) {
        this.workflows.set(id, config);
    }
    /**
     * Get MCP server info
     */
    getServerInfo() {
        return this.config;
    }
    /**
     * List available resources (workflows)
     */
    listResources() {
        const resources = [];
        this.workflows.forEach((config, id) => {
            resources.push({
                uri: `settler://workflow/${id}`,
                name: config.metadata.name,
                description: config.metadata.description ?? undefined,
                mimeType: 'application/json'
            });
        });
        return resources;
    }
    /**
     * Get a resource (workflow config)
     */
    getResource(uri) {
        const match = uri.match(/^settler:\/\/workflow\/(.+)$/);
        if (!match || !match[1]) {
            return null;
        }
        const id = match[1];
        return this.workflows.get(id) || null;
    }
    /**
     * List available tools
     */
    listTools() {
        return [
            {
                name: 'compile_reconciliation_workflow',
                description: 'Compile a React.Settler workflow to JSON configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'ID of the workflow to compile'
                        }
                    },
                    required: ['workflowId']
                }
            },
            {
                name: 'validate_transaction',
                description: 'Validate a reconciliation transaction',
                inputSchema: {
                    type: 'object',
                    properties: {
                        transaction: {
                            type: 'object',
                            description: 'Transaction object to validate'
                        }
                    },
                    required: ['transaction']
                }
            },
            {
                name: 'create_reconciliation_workflow',
                description: 'Create a new reconciliation workflow configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        rulesets: { type: 'array' }
                    },
                    required: ['name']
                }
            }
        ];
    }
    /**
     * Call a tool
     */
    async callTool(name, args) {
        switch (name) {
            case 'compile_reconciliation_workflow':
                return this.compileWorkflow(args.workflowId);
            case 'validate_transaction':
                return this.validateTransaction(args.transaction);
            case 'create_reconciliation_workflow':
                return this.createWorkflow(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    compileWorkflow(workflowId) {
        const config = this.workflows.get(workflowId);
        if (!config) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        return config;
    }
    validateTransaction(transaction) {
        // Basic validation
        const errors = [];
        if (!transaction.id) {
            errors.push('Transaction ID is required');
        }
        if (!transaction.amount || typeof transaction.amount.value !== 'number') {
            errors.push('Valid amount is required');
        }
        if (!transaction.currency) {
            errors.push('Currency is required');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    createWorkflow(args) {
        return {
            version: '1.0.0',
            metadata: {
                name: args.name,
                description: args.description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            rulesets: args.rulesets || [],
            views: [],
            widgets: {}
        };
    }
}
exports.ReactSettlerMCPServer = ReactSettlerMCPServer;
/**
 * Create MCP server instance
 */
function createMCPServer(config) {
    return new ReactSettlerMCPServer(config);
}
//# sourceMappingURL=mcp.js.map