/**
 * Agent-in-the-Loop Code Evolution
 *
 * Agents that can rewrite code modules
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */
export interface CodeEvolution {
    moduleId: string;
    moduleType: 'helper' | 'transform' | 'metadata' | 'index' | 'migration';
    currentCode: string;
    evolvedCode: string;
    changes: string[];
    confidence: number;
    validated: boolean;
}
export interface CodeModule {
    id: string;
    name?: string;
    type?: string;
    code?: string;
    [key: string]: unknown;
}
export declare class AgentCodeEvolution {
    private validator;
    constructor();
    /**
     * Evolve code modules
     */
    evolveCode(module: CodeModule): Promise<CodeEvolution | null>;
    /**
     * Determine evolution type
     */
    private determineEvolutionType;
    /**
     * Evolve helper function
     */
    private evolveHelperFunction;
    /**
     * Evolve transform logic
     */
    private evolveTransformLogic;
    /**
     * Evolve metadata
     */
    private evolveMetadata;
    /**
     * Evolve database index
     */
    private evolveIndex;
    /**
     * Evolve migration
     */
    private evolveMigration;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Apply code evolution
     */
    applyEvolution(evolution: CodeEvolution): Promise<void>;
}
//# sourceMappingURL=agent-code-evolution.d.ts.map