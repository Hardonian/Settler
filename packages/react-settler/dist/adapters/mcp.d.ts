/**
 * MCP (Model Context Protocol) Server Integration
 * Enables React.Settler to work with MCP-compatible tools and AI assistants
 */
import { ReconciliationConfig } from '@settler/protocol';
export interface MCPServerConfig {
    name: string;
    version: string;
    description?: string;
}
export interface MCPResource {
    uri: string;
    name: string;
    description?: string | undefined;
    mimeType?: string | undefined;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
/**
 * MCP Server for React.Settler
 * Exposes reconciliation workflows as MCP resources and tools
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
export declare class ReactSettlerMCPServer {
    private config;
    private workflows;
    constructor(config: MCPServerConfig);
    /**
     * Register a reconciliation workflow
     */
    registerWorkflow(id: string, config: ReconciliationConfig): void;
    /**
     * Get MCP server info
     */
    getServerInfo(): MCPServerConfig;
    /**
     * List available resources (workflows)
     */
    listResources(): MCPResource[];
    /**
     * Get a resource (workflow config)
     */
    getResource(uri: string): ReconciliationConfig | null;
    /**
     * List available tools
     */
    listTools(): MCPTool[];
    /**
     * Call a tool
     */
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    private compileWorkflow;
    private validateTransaction;
    private createWorkflow;
}
/**
 * Create MCP server instance
 */
export declare function createMCPServer(config: MCPServerConfig): ReactSettlerMCPServer;
//# sourceMappingURL=mcp.d.ts.map