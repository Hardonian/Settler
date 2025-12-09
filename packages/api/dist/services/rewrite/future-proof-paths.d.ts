/**
 * Future-Proof Code Paths
 *
 * Placeholders for next-generation capabilities
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */
export interface FutureProofPath {
    name: string;
    description: string;
    status: 'planned' | 'in_progress' | 'ready';
    integrationPoints: string[];
}
export declare class FutureProofPaths {
    /**
     * Get all future-proof paths
     */
    getFutureProofPaths(): FutureProofPath[];
    /**
     * Check if a path is ready for integration
     */
    isPathReady(pathName: string): boolean;
    /**
     * Get integration points for a path
     */
    getIntegrationPoints(pathName: string): string[];
}
//# sourceMappingURL=future-proof-paths.d.ts.map