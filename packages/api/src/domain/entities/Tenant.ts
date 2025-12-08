/**
 * Tenant Domain Entity
 * Represents a tenant in the multi-tenant system with hierarchy support
 */

export enum TenantTier {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  SCALE = 'scale',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

export interface TenantQuotas {
  rateLimitRpm: number; // Requests per minute
  storageBytes: number; // Storage quota in bytes
  concurrentJobs: number; // Max concurrent reconciliation jobs
  monthlyReconciliations: number; // Monthly reconciliation quota
  customDomains: number; // Number of custom domains allowed
}

export interface TenantConfig {
  customDomain?: string;
  customDomainVerified: boolean;
  dataResidencyRegion: string;
  enableAdvancedMatching: boolean;
  enableMLFeatures: boolean;
  webhookTimeout: number; // milliseconds
  maxRetries: number;
  [key: string]: any; // Allow extensible config
}

export interface TenantProps {
  id: string;
  name: string;
  slug: string; // URL-safe identifier
  parentTenantId?: string; // For sub-accounts
  tier: TenantTier;
  status: TenantStatus;
  quotas: TenantQuotas;
  config: TenantConfig;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Tenant {
  private constructor(private props: TenantProps) {}

  static create(props: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
    return new Tenant({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get parentTenantId(): string | undefined {
    return this.props.parentTenantId;
  }

  get tier(): TenantTier {
    return this.props.tier;
  }

  get status(): TenantStatus {
    return this.props.status;
  }

  get quotas(): TenantQuotas {
    return { ...this.props.quotas };
  }

  get config(): TenantConfig {
    return { ...this.props.config };
  }

  get metadata(): Record<string, any> {
    return { ...this.props.metadata };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  isEnterprise(): boolean {
    return this.props.tier === TenantTier.ENTERPRISE;
  }

  isSubAccount(): boolean {
    return !!this.props.parentTenantId;
  }

  updateTier(tier: TenantTier): void {
    this.props.tier = tier;
    this.props.updatedAt = new Date();
  }

  updateStatus(status: TenantStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  updateQuotas(quotas: Partial<TenantQuotas>): void {
    this.props.quotas = { ...this.props.quotas, ...quotas };
    this.props.updatedAt = new Date();
  }

  updateConfig(config: Partial<TenantConfig>): void {
    this.props.config = { ...this.props.config, ...config };
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  setCustomDomain(domain: string, verified: boolean = false): void {
    this.props.config.customDomain = domain;
    this.props.config.customDomainVerified = verified;
    this.props.updatedAt = new Date();
  }

  markAsDeleted(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toPersistence(): TenantProps {
    return { ...this.props };
  }
}
