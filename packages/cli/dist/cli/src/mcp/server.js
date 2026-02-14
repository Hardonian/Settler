"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpStdioServer = startMcpStdioServer;
const node_readline_1 = require("node:readline");
const tools = [
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
function writeResponse(response) {
    process.stdout.write(`${JSON.stringify(response)}\n`);
}
function createError(code, message, data) {
    return { code, message, ...(data !== undefined ? { data } : {}) };
}
function handleToolCall(params) {
    const call = params;
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
function startMcpStdioServer(options = {}) {
    const appName = options.appName ?? "settler-cli";
    const appVersion = options.appVersion ?? "1.0.0";
    const rl = (0, node_readline_1.createInterface)({
        input: process.stdin,
        crlfDelay: Infinity,
    });
    const shutdown = () => {
        rl.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    rl.on("line", (line) => {
        if (!line.trim()) {
            return;
        }
        let request;
        try {
            request = JSON.parse(line);
        }
        catch {
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
        }
        catch (error) {
            const rpcError = typeof error === "object" && error !== null && "code" in error && "message" in error
                ? error
                : createError(-32603, error instanceof Error ? error.message : "Unknown error");
            writeResponse({
                jsonrpc: "2.0",
                id,
                error: rpcError,
            });
        }
    });
}
//# sourceMappingURL=server.js.map