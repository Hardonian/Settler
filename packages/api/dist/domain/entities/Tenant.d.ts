/**
 * Tenant Domain Entity
 * Represents a tenant in the multi-tenant system with hierarchy support
 */
export declare enum TenantTier {
    FREE = "free",
    STARTER = "starter",
    GROWTH = "growth",
    SCALE = "scale",
    ENTERPRISE = "enterprise"
}
export declare enum TenantStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    TRIAL = "trial",
    CANCELLED = "cancelled"
}
export interface TenantQuotas {
    rateLimitRpm: number;
    storageBytes: number;
    concurrentJobs: number;
    monthlyReconciliations: number;
    customDomains: number;
}
export interface TenantConfig {
    customDomain?: string;
    customDomainVerified: boolean;
    dataResidencyRegion: string;
    enableAdvancedMatching: boolean;
    enableMLFeatures: boolean;
    webhookTimeout: number;
    maxRetries: number;
    [key: string]: any;
}
export interface TenantProps {
    id: string;
    name: string;
    slug: string;
    parentTenantId?: string;
    tier: TenantTier;
    status: TenantStatus;
    quotas: TenantQuotas;
    config: TenantConfig;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Tenant {
    private props;
    private constructor();
    static create(props: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>): Tenant;
    static fromPersistence(props: TenantProps): Tenant;
    get id(): string;
    get name(): string;
    get slug(): string;
    get parentTenantId(): string | undefined;
    get tier(): TenantTier;
    get status(): TenantStatus;
    get quotas(): TenantQuotas;
    get config(): TenantConfig;
    get metadata(): Record<string, any>;
    get createdAt(): Date;
    get updatedAt(): Date;
    get deletedAt(): Date | undefined;
    isDeleted(): boolean;
    isEnterprise(): boolean;
    isSubAccount(): boolean;
    updateTier(tier: TenantTier): void;
    updateStatus(status: TenantStatus): void;
    updateQuotas(quotas: Partial<TenantQuotas>): void;
    updateConfig(config: Partial<TenantConfig>): void;
    updateMetadata(metadata: Record<string, any>): void;
    setCustomDomain(domain: string, verified?: boolean): void;
    markAsDeleted(): void;
    toPersistence(): TenantProps;
}
//# sourceMappingURL=Tenant.d.ts.map