/**
 * Hardware / Runtime Flexibility
 *
 * Support for SAFEs, local inference, GPU/CPU hybrid, cloud-agnostic deployments
 * Part 13: Long-Range Futureproofing
 */
export interface RuntimeConfig {
    type: 'safe' | 'local' | 'gpu' | 'cpu' | 'hybrid' | 'cloud';
    endpoint?: string;
    capabilities: string[];
}
export interface ExecutionEnvironment {
    id: string;
    type: string;
    available: boolean;
    latency: number;
    cost: number;
}
export declare class HardwareFlexibility {
    private runtimes;
    private environments;
    constructor();
    /**
     * Register runtime
     */
    registerRuntime(config: RuntimeConfig): void;
    /**
     * Register execution environment
     */
    registerEnvironment(env: ExecutionEnvironment): void;
    /**
     * Get optimal execution environment
     */
    getOptimalEnvironment(requirements: {
        latency?: number;
        cost?: number;
        privacy?: boolean;
        scale?: number;
    }): ExecutionEnvironment | null;
    /**
     * Support for Secure AI Function Enclaves (SAFEs)
     */
    executeInSAFE(_code: string, input: Record<string, unknown>): Promise<{
        success: boolean;
        result: Record<string, unknown>;
    }>;
    /**
     * Local inference
     */
    executeLocalInference(_model: string, input: Record<string, unknown>): Promise<{
        success: boolean;
        result: Record<string, unknown>;
    }>;
    /**
     * GPU/CPU hybrid scaling
     */
    executeHybrid(tasks: Array<{
        type: 'gpu' | 'cpu';
        task: Record<string, unknown>;
    }>): Promise<Array<{
        success: boolean;
        result: Record<string, unknown>;
    }>>;
    /**
     * Cloud-agnostic deployment
     */
    deployCloudAgnostic(config: {
        provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'supabase';
        region: string;
    }): Promise<string>;
}
//# sourceMappingURL=hardware-flexibility.d.ts.map