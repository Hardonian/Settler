/**
 * Self-Validating Code Modules
 *
 * CI-like internal checks for each change
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */
export interface ValidationResult {
    check: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: Record<string, unknown>;
}
export interface ModuleValidation {
    moduleId: string;
    moduleType: 'service' | 'route' | 'middleware' | 'transform' | 'workflow';
    results: ValidationResult[];
    overallStatus: 'pass' | 'fail' | 'warning';
}
export declare class SelfValidator {
    /**
     * Validate a code module
     */
    validateModule(module: {
        id?: string;
        schemaReferences?: unknown[];
        [key: string]: unknown;
    }, moduleType: string): Promise<ModuleValidation>;
    /**
     * Validate TypeScript types
     */
    private validateTypeScript;
    /**
     * Validate schema integrity
     */
    private validateSchemaIntegrity;
    /**
     * Simulate pipeline execution
     */
    private simulatePipeline;
    /**
     * Check build viability for Vercel
     */
    private checkBuildViability;
    /**
     * Evaluate risks
     */
    private evaluateRisks;
    /**
     * Check compatibility
     */
    private checkCompatibility;
    /**
     * Determine overall status
     */
    private determineOverallStatus;
}
//# sourceMappingURL=self-validator.d.ts.map