/**
 * WASM-Powered Transforms
 *
 * Secure, sandboxed, fast deterministic computation
 * Part 10: Next-Gen Data Plane & Processing Layers
 */
export interface SchemaDefinition {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, SchemaDefinition>;
    items?: SchemaDefinition;
    required?: string[];
    [key: string]: unknown;
}
export interface WASMTransform {
    id: string;
    name: string;
    wasmModule: ArrayBuffer;
    inputSchema: SchemaDefinition;
    outputSchema: SchemaDefinition;
    executionTime: number;
    memoryUsage: number;
}
export declare class WASMTransforms {
    private transforms;
    /**
     * Register WASM transform
     */
    registerTransform(transform: WASMTransform): Promise<void>;
    /**
     * Execute WASM transform
     */
    executeTransform(transformId: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Validate transform schema
     */
    validateSchema(_data: unknown, _schema: SchemaDefinition): boolean;
    /**
     * Get transform metadata
     */
    getTransform(transformId: string): WASMTransform | undefined;
    /**
     * List all transforms
     */
    listTransforms(): WASMTransform[];
}
//# sourceMappingURL=wasm-transforms.d.ts.map