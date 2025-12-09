/**
 * API Standards Evolution
 *
 * Prepare for LLM Function Calling vNext, Typed JSON, Recon DSL
 * Part 13: Long-Range Futureproofing
 */
export interface FunctionCallingSpec {
    version: string;
    format: 'json' | 'typescript' | 'dsl';
    capabilities: string[];
}
export interface TypedJSONSchema {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
}
export interface ReconDSL {
    syntax: string;
    operations: string[];
    examples: string[];
}
export declare class APIEvolution {
    private functionCallingSpecs;
    private typedJSONSchemas;
    private reconDSL;
    constructor();
    /**
     * Register function calling spec
     */
    registerFunctionCallingSpec(spec: FunctionCallingSpec): void;
    /**
     * Get function calling spec
     */
    getFunctionCallingSpec(version: string): FunctionCallingSpec | undefined;
    /**
     * Register typed JSON schema
     */
    registerTypedJSONSchema(name: string, schema: TypedJSONSchema): void;
    /**
     * Validate typed JSON
     */
    validateTypedJSON(_data: unknown, schemaName: string): boolean;
    /**
     * Define Recon DSL
     */
    defineReconDSL(dsl: ReconDSL): void;
    /**
     * Parse Recon DSL
     */
    parseReconDSL(_code: string): Record<string, unknown>;
    /**
     * Execute Recon DSL
     */
    executeReconDSL(code: string): Promise<{
        success: boolean;
        result: Record<string, unknown>;
    }>;
}
//# sourceMappingURL=api-evolution.d.ts.map