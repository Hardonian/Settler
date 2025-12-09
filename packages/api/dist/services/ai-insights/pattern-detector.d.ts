/**
 * Pattern Detection Service
 * Detects usage patterns, feature dependencies, and user behavior clusters
 */
export interface FeatureDependency {
    featureA: string;
    featureB: string;
    correlation: number;
    sampleSize: number;
}
export interface UserCluster {
    clusterName: string;
    userIds: string[];
    characteristics: string[];
    recommendations: string[];
    size: number;
}
/**
 * Detect feature dependencies (which features users use together)
 */
export declare function detectFeatureDependencies(days?: number): Promise<FeatureDependency[]>;
/**
 * Cluster users by behavior patterns
 */
export declare function clusterUsersByBehavior(): Promise<UserCluster[]>;
/**
 * Detect incomplete workflows
 */
export declare function detectIncompleteWorkflows(userId?: string): Promise<Array<{
    userId: string;
    workflowType: string;
    dropOffStep: string;
    completionRate: number;
}>>;
//# sourceMappingURL=pattern-detector.d.ts.map