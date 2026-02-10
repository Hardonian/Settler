import { createInterface } from "node:readline";

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPServerOptions {
  appName?: string;
  appVersion?: string;
}

const tools: MCPToolDefinition[] = [
  {
    name: "ping",
    description: "Fast health check tool",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "echo",
    description: "Echo input payload",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to echo" },
      },
      required: ["message"],
    },
  },
];

function writeResponse(response: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

function createError(code: number, message: string, data?: unknown): JsonRpcError {
  return { code, message, ...(data !== undefined ? { data } : {}) };
}

function handleToolCall(params: unknown): unknown {
  const call = params as { name?: string; arguments?: Record<string, unknown> };
  if (!call?.name) {
    throw createError(-32602, "Missing tool name");
  }

  if (call.name === "ping") {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  if (call.name === "echo") {
    const message = call.arguments?.message;
    if (typeof message !== "string" || message.length === 0) {
      throw createError(-32602, "echo requires a non-empty string message");
    }

    return { message };
  }

  throw createError(-32601, `Unknown tool: ${call.name}`);
}

export function startMcpStdioServer(options: MCPServerOptions = {}): void {
  const appName = options.appName ?? "settler-cli";
  const appVersion = options.appVersion ?? "1.0.0";

  const rl = createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  const shutdown = (): void => {
    rl.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  rl.on("line", (line) => {
    if (!line.trim()) {
      return;
    }

    let request: JsonRpcRequest;

    try {
      request = JSON.parse(line) as JsonRpcRequest;
    } catch {
      writeResponse({
        jsonrpc: "2.0",
        id: null,
        error: createError(-32700, "Invalid JSON"),
      });
      return;
    }

    const id = request.id ?? null;

    if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      writeResponse({
        jsonrpc: "2.0",
        id,
        error: createError(-32600, "Invalid JSON-RPC request"),
      });
      return;
    }

    try {
      if (request.method === "initialize") {
        writeResponse({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: { name: appName, version: appVersion },
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
            },
          },
        });
        return;
      }

      if (request.method === "tools/list") {
        writeResponse({ jsonrpc: "2.0", id, result: { tools } });
        return;
      }

      if (request.method === "tools/call") {
        writeResponse({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(handleToolCall(request.params)),
              },
            ],
          },
        });
        return;
      }

      if (request.method === "ping") {
        writeResponse({ jsonrpc: "2.0", id, result: { ok: true } });
        return;
      }

      if (request.method === "shutdown") {
        writeResponse({ jsonrpc: "2.0", id, result: { ok: true } });
        shutdown();
        return;
      }

      writeResponse({
        jsonrpc: "2.0",
        id,
        error: createError(-32601, `Method not found: ${request.method}`),
      });
    } catch (error) {
      const rpcError =
        typeof error === "object" && error !== null && "code" in error && "message" in error
          ? (error as JsonRpcError)
          : createError(-32603, error instanceof Error ? error.message : "Unknown error");

      writeResponse({
        jsonrpc: "2.0",
        id,
        error: rpcError,
      });
    }
  });
}
