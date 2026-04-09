/**
 * MCP (Model Context Protocol) Server Integration
 * Enables React.Settler to work with MCP-compatible tools and AI assistants
 */

import { ReconciliationConfig, ReconciliationTransaction } from "@settler/protocol";

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
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

import { requireFeature, FEATURE_FLAGS } from "../utils/licensing";

/**
 * MCP Server for React.Settler
 * Exposes reconciliation workflows as MCP resources and tools
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
export class ReactSettlerMCPServer {
  private config: MCPServerConfig;
  private workflows: Map<string, ReconciliationConfig> = new Map();

  constructor(config: MCPServerConfig) {
    requireFeature(FEATURE_FLAGS.MCP_INTEGRATION, "MCP Server Integration");
    this.config = config;
  }

  /**
   * Register a reconciliation workflow
   */
  registerWorkflow(id: string, config: ReconciliationConfig): void {
    this.workflows.set(id, config);
  }

  /**
   * Get MCP server info
   */
  getServerInfo(): MCPServerConfig {
    return this.config;
  }

  /**
   * List available resources (workflows)
   */
  listResources(): MCPResource[] {
    const resources: MCPResource[] = [];

    this.workflows.forEach((config, id) => {
      resources.push({
        uri: `settler://workflow/${id}`,
        name: config.metadata.name,
        description: config.metadata.description ?? undefined,
        mimeType: "application/json",
      });
    });

    return resources;
  }

  /**
   * Get a resource (workflow config)
   */
  getResource(uri: string): ReconciliationConfig | null {
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
  listTools(): MCPTool[] {
    return [
      {
        name: "compile_reconciliation_workflow",
        description: "Compile a React.Settler workflow to JSON configuration",
        inputSchema: {
          type: "object",
          properties: {
            workflowId: {
              type: "string",
              description: "ID of the workflow to compile",
            },
          },
          required: ["workflowId"],
        },
      },
      {
        name: "validate_transaction",
        description: "Validate a reconciliation transaction",
        inputSchema: {
          type: "object",
          properties: {
            transaction: {
              type: "object",
              description: "Transaction object to validate",
            },
          },
          required: ["transaction"],
        },
      },
      {
        name: "create_reconciliation_workflow",
        description: "Create a new reconciliation workflow configuration",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            rulesets: { type: "array" },
          },
          required: ["name"],
        },
      },
    ];
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case "compile_reconciliation_workflow":
        return this.compileWorkflow(args.workflowId as string);

      case "validate_transaction":
        return this.validateTransaction(args.transaction as ReconciliationTransaction);

      case "create_reconciliation_workflow":
        return this.createWorkflow(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private compileWorkflow(workflowId: string): ReconciliationConfig {
    const config = this.workflows.get(workflowId);
    if (!config) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    return config;
  }

  private validateTransaction(transaction: ReconciliationTransaction): {
    valid: boolean;
    errors: string[];
  } {
    // Basic validation
    const errors: string[] = [];

    if (!transaction.id) {
      errors.push("Transaction ID is required");
    }
    if (!transaction.amount || typeof transaction.amount.value !== "number") {
      errors.push("Valid amount is required");
    }
    if (!transaction.currency) {
      errors.push("Currency is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private createWorkflow(args: Record<string, unknown>): ReconciliationConfig {
    return {
      version: "1.0.0",
      metadata: {
        name: args.name as string,
        description: args.description as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      rulesets: (args.rulesets as any[]) || [],
      views: [],
      widgets: {},
    };
  }
}

/**
 * Create MCP server instance
 */
export function createMCPServer(config: MCPServerConfig): ReactSettlerMCPServer {
  return new ReactSettlerMCPServer(config);
}
