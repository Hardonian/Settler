/**
 * Retention Policy Configuration Service
 *
 * Manages tenant-level retention policies for export artifacts.
 * Supports configurable retention periods per artifact type and tenant.
 */

import { prisma } from "../../infrastructure/db/prisma";
import { logInfo, logError } from "../../utils/logger";

export type RetentionPeriodUnit = "days" | "weeks" | "months" | "forever";

export interface RetentionPeriod {
  value: number;
  unit: RetentionPeriodUnit;
}

export interface ArtifactTypeRetention {
  csv: RetentionPeriod;
  json: RetentionPeriod;
  excel: RetentionPeriod;
  pdf: RetentionPeriod;
}

export interface TenantRetentionPolicy {
  tenantId: string;
  artifactRetention: ArtifactTypeRetention;
  isCustomPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionPolicyDefaults {
  defaultCsv: RetentionPeriod;
  defaultJson: RetentionPeriod;
  defaultExcel: RetentionPeriod;
  defaultPdf: RetentionPeriod;
}

const DEFAULT_RETENTION_PERIODS: RetentionPeriod = { value: 30, unit: "days" };
const DEFAULT_ENTERPRISE_RETENTION: RetentionPeriod = { value: 90, unit: "days" };

export const DEFAULT_RETENTION_POLICY: RetentionPolicyDefaults = {
  defaultCsv: DEFAULT_RETENTION_PERIODS,
  defaultJson: DEFAULT_RETENTION_PERIODS,
  defaultExcel: DEFAULT_RETENTION_PERIODS,
  defaultPdf: DEFAULT_RETENTION_PERIODS,
};

/**
 * Convert retention period to days
 */
export function retentionPeriodToDays(period: RetentionPeriod): number {
  if (period.unit === "forever") {
    return Infinity;
  }

  switch (period.unit) {
    case "days":
      return period.value;
    case "weeks":
      return period.value * 7;
    case "months":
      return period.value * 30;
    default:
      return period.value;
  }
}

/**
 * Convert days to retention period
 */
export function daysToRetentionPeriod(days: number): RetentionPeriod {
  if (days === Infinity || days <= 0) {
    return { value: 0, unit: "forever" };
  }

  if (days >= 365) {
    return { value: Math.floor(days / 30), unit: "months" };
  }

  if (days >= 14 && days % 7 === 0) {
    return { value: days / 7, unit: "weeks" };
  }

  return { value: days, unit: "days" };
}

/**
 * Retention Policy Service
 */
export class RetentionPolicyService {
  /**
   * Get retention policy for a tenant
   */
  async getTenantRetentionPolicy(tenantId: string): Promise<TenantRetentionPolicy> {
    try {
      // Check if tenant has custom policy stored in metadata
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!tenant) {
        // Return default policy if tenant not found
        return this.getDefaultPolicy(tenantId);
      }

      const metadata = (tenant.metadata as Record<string, unknown>) || {};
      const retentionConfig = metadata.retentionPolicy as TenantRetentionPolicy | undefined;

      if (retentionConfig) {
        return {
          ...retentionConfig,
          tenantId,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        };
      }

      // Check subscription-based policy
      return await this.getSubscriptionBasedPolicy(tenantId);
    } catch (error) {
      logError("Failed to get tenant retention policy", error, { tenantId });
      return this.getDefaultPolicy(tenantId);
    }
  }

  /**
   * Get subscription-based policy for tenant
   */
  private async getSubscriptionBasedPolicy(tenantId: string): Promise<TenantRetentionPolicy> {
    try {
      // Find billing account for tenant
      const billingAccount = await prisma.billingAccount.findFirst({
        where: { tenantId },
        select: { id: true },
      });

      if (!billingAccount) {
        return this.getDefaultPolicy(tenantId);
      }

      // Get active subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          billingAccountId: billingAccount.id,
          status: "active",
        },
        orderBy: { createdAt: "desc" },
        select: { planId: true },
      });

      const planId = subscription?.planId;
      const isEnterprise = planId === "enterprise" || planId === "scale";

      return {
        tenantId,
        artifactRetention: this.getArtifactRetentionFromPlan(isEnterprise),
        isCustomPolicy: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logError("Failed to get subscription-based policy", error, { tenantId });
      return this.getDefaultPolicy(tenantId);
    }
  }

  /**
   * Get artifact retention based on subscription plan
   */
  private getArtifactRetentionFromPlan(isEnterprise: boolean): ArtifactTypeRetention {
    const retention = isEnterprise ? DEFAULT_ENTERPRISE_RETENTION : DEFAULT_RETENTION_PERIODS;

    return {
      csv: retention,
      json: retention,
      excel: retention,
      pdf: retention,
    };
  }

  /**
   * Get default retention policy
   */
  private getDefaultPolicy(tenantId: string): TenantRetentionPolicy {
    return {
      tenantId,
      artifactRetention: {
        csv: DEFAULT_RETENTION_PERIODS,
        json: DEFAULT_RETENTION_PERIODS,
        excel: DEFAULT_RETENTION_PERIODS,
        pdf: DEFAULT_RETENTION_PERIODS,
      },
      isCustomPolicy: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Set custom retention policy for tenant
   */
  async setTenantRetentionPolicy(
    tenantId: string,
    artifactRetention: Partial<ArtifactTypeRetention>
  ): Promise<TenantRetentionPolicy> {
    try {
      // Get current tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metadata: true, createdAt: true },
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const currentMetadata = (tenant.metadata as Record<string, unknown>) || {};
      const currentPolicy =
        (currentMetadata.retentionPolicy as TenantRetentionPolicy) ||
        this.getDefaultPolicy(tenantId);

      // Merge with current policy
      const newArtifactRetention: ArtifactTypeRetention = {
        csv: artifactRetention.csv ?? currentPolicy.artifactRetention.csv,
        json: artifactRetention.json ?? currentPolicy.artifactRetention.json,
        excel: artifactRetention.excel ?? currentPolicy.artifactRetention.excel,
        pdf: artifactRetention.pdf ?? currentPolicy.artifactRetention.pdf,
      };

      const newPolicy: TenantRetentionPolicy = {
        tenantId,
        artifactRetention: newArtifactRetention,
        isCustomPolicy: true,
        createdAt: currentPolicy.createdAt,
        updatedAt: new Date(),
      };

      // Update tenant metadata
      const updatedMetadata = {
        ...currentMetadata,
        retentionPolicy: newPolicy,
      };

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          metadata: updatedMetadata as any,
          updatedAt: new Date(),
        },
      });

      logInfo("Set tenant retention policy", {
        tenantId,
        artifactRetention: newArtifactRetention,
      });

      return newPolicy;
    } catch (error) {
      logError("Failed to set tenant retention policy", error, { tenantId });
      throw error;
    }
  }

  /**
   * Reset tenant retention policy to default
   */
  async resetTenantRetentionPolicy(tenantId: string): Promise<TenantRetentionPolicy> {
    try {
      // Get current tenant metadata
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metadata: true },
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const currentMetadata = (tenant.metadata as Record<string, unknown>) || {};

      // Remove retention policy from metadata
      const newMetadata = { ...currentMetadata };
      delete newMetadata.retentionPolicy;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          metadata: newMetadata as any,
          updatedAt: new Date(),
        },
      });

      logInfo("Reset tenant retention policy to default", { tenantId });

      return await this.getTenantRetentionPolicy(tenantId);
    } catch (error) {
      logError("Failed to reset tenant retention policy", error, { tenantId });
      throw error;
    }
  }

  /**
   * Get retention cutoff date for artifact type
   */
  async getRetentionCutoffDate(tenantId: string, artifactType: string): Promise<Date> {
    const policy = await this.getTenantRetentionPolicy(tenantId);

    let retentionPeriod: RetentionPeriod;
    switch (artifactType.toLowerCase()) {
      case "csv":
        retentionPeriod = policy.artifactRetention.csv;
        break;
      case "json":
        retentionPeriod = policy.artifactRetention.json;
        break;
      case "excel":
        retentionPeriod = policy.artifactRetention.excel;
        break;
      case "pdf":
        retentionPeriod = policy.artifactRetention.pdf;
        break;
      default:
        retentionPeriod = DEFAULT_RETENTION_PERIODS;
    }

    if (retentionPeriod.unit === "forever") {
      // Return a date far in the future
      return new Date("2099-12-31T23:59:59.999Z");
    }

    const cutoffDate = new Date();
    const days = retentionPeriodToDays(retentionPeriod);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return cutoffDate;
  }

  /**
   * Get all tenant retention policies
   */
  async getAllTenantRetentionPolicies(): Promise<TenantRetentionPolicy[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const tenantIds = tenants.map((t) => t.id);

      // Bulk fetch billing accounts
      const billingAccounts = await prisma.billingAccount.findMany({
        where: { tenantId: { in: tenantIds } },
        select: { id: true, tenantId: true },
      });

      const billingAccountIds = billingAccounts.map((ba) => ba.id);

      // Bulk fetch subscriptions
      const subscriptions = await prisma.subscription.findMany({
        where: {
          billingAccountId: { in: billingAccountIds },
          status: "active",
        },
        orderBy: { createdAt: "desc" },
        select: { planId: true, billingAccountId: true },
      });

      // Map billing accounts to their active subscription
      const subByBillingAccount = new Map<string, any>();
      for (const sub of subscriptions) {
        // Keep the first one since it's ordered by createdAt desc
        if (!subByBillingAccount.has(sub.billingAccountId)) {
          subByBillingAccount.set(sub.billingAccountId, sub);
        }
      }

      // Map tenants to their billing accounts
      const baByTenant = new Map<string, any>();
      for (const ba of billingAccounts) {
        if (ba.tenantId) {
          baByTenant.set(ba.tenantId, ba);
        }
      }

      const policies: TenantRetentionPolicy[] = [];

      for (const tenant of tenants) {
        const metadata = (tenant.metadata as Record<string, unknown>) || {};
        const retentionConfig = metadata.retentionPolicy as TenantRetentionPolicy | undefined;

        if (retentionConfig) {
          policies.push({
            ...retentionConfig,
            tenantId: tenant.id,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
          });
          continue;
        }

        const billingAccount = baByTenant.get(tenant.id);
        if (!billingAccount) {
          policies.push(this.getDefaultPolicy(tenant.id));
          continue;
        }

        const subscription = subByBillingAccount.get(billingAccount.id);
        const planId = subscription?.planId;
        const isEnterprise = planId === "enterprise" || planId === "scale";

        policies.push({
          tenantId: tenant.id,
          artifactRetention: this.getArtifactRetentionFromPlan(isEnterprise),
          isCustomPolicy: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return policies;
    } catch (error) {
      logError("Failed to get all tenant retention policies", error);
      throw error;
    }
  }
}

export const retentionPolicyService = new RetentionPolicyService();
