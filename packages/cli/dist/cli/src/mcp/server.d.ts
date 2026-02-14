export interface JsonRpcRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: unknown;
}
interface MCPServerOptions {
    appName?: string;
    appVersion?: string;
}
export declare function startMcpStdioServer(options?: MCPServerOptions): void;
export {};
//# sourceMappingURL=server.d.ts.map