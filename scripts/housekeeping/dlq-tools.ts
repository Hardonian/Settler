import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { query } from "../db";
import { AlertNotifier } from "../services/alerts/notifier";

/**
 * Starts the Settler Operations MCP Server.
 * Connects via stdio to provide AI agents direct querying capabilities into the control plane.
 */
export function startMCPServer() {
  const server = new Server(
    {
      name: "Settler Operations MCP",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "query_dlq",
          description:
            "Query the Dead Letter Queue (DLQ) for failed webhooks and ingestion errors.",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of records to return (default 10, max 100)",
              },
              tenant_id: { type: "string", description: "Filter by a specific tenant ID" },
              source: {
                type: "string",
                description: "Filter by source system (e.g., 'shopify', 'stripe')",
              },
            },
          },
        },
        {
          name: "replay_dlq_webhook",
          description:
            "Replays a specific webhook from the DLQ by its ID and drops it back into the queue.",
          inputSchema: {
            type: "object",
            properties: {
              dlq_id: { type: "string", description: "The UUID of the DLQ record to replay" },
            },
            required: ["dlq_id"],
          },
        },
      ],
    };
  });

  // Handle Tool Executions
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query_dlq") {
      const limit = Math.min((request.params.arguments?.limit as number) || 10, 100);
      const tenantId = request.params.arguments?.tenant_id as string | undefined;
      const source = request.params.arguments?.source as string | undefined;

      let sql = `SELECT id, tenant_id, source, error_reason, created_at FROM public.ingestion_dlq WHERE 1=1`;
      const params: any[] = [];

      if (tenantId) {
        params.push(tenantId);
        sql += ` AND tenant_id = $${params.length}`;
      }
      if (source) {
        params.push(source);
        sql += ` AND source = $${params.length}`;
      }

      params.push(limit);
      sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

      const result = await query(sql, params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    throw new Error(`Tool ${request.params.name} not found`);
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}
