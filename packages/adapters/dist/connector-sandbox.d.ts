import { ConnectorDriver, SyncOptions } from "./connector-driver";
export interface ConnectorSandboxOptions {
    timeoutMs?: number;
    allowWallClockTime?: boolean;
}
export declare function executeConnectorSandboxed(params: {
    driver: ConnectorDriver;
    credentials: Record<string, unknown>;
    options: SyncOptions;
    sandbox?: ConnectorSandboxOptions;
}): Promise<Awaited<ReturnType<ConnectorDriver["sync"]>>>;
//# sourceMappingURL=connector-sandbox.d.ts.map