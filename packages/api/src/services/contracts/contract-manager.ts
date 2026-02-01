/**
 * Data Contract Manager
 * 
 * Manages data contract versioning and breaking change detection
 * Part of Phase V: AIOS
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - PrismaClient is generated at build time
import { PrismaClient, Prisma } from '@prisma/client';
import { logInfo } from '../../utils/logger';

export interface ContractSchema {
  type: 'object' | 'array';
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface BreakingChange {
  type: 'field_removed' | 'field_type_changed' | 'required_added' | 'enum_restricted';
  field: string;
  before: unknown;
  after: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ContractManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create new contract version
   */
  async createContractVersion(
    tenantId: string,
    contractName: string,
    version: string,
    schema: ContractSchema
  ) {
    const contract = await this.prisma.contractVersion.create({
      data: {
        tenantId,
        contractName,
        version,
        schemaDefinition: schema as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    logInfo('Contract version created', { tenantId, contractName, version });
    return contract;
  }

  /**
   * Compare contract versions and detect breaking changes
   */
  async detectBreakingChanges(
    tenantId: string,
    contractName: string,
    oldVersion: string,
    newVersion: string
  ): Promise<BreakingChange[]> {
    const oldContract = await this.prisma.contractVersion.findUnique({
      where: {
        tenantId_contractName_version: {
          tenantId,
          contractName,
          version: oldVersion,
        },
      },
    });

    const newContract = await this.prisma.contractVersion.findUnique({
      where: {
        tenantId_contractName_version: {
          tenantId,
          contractName,
          version: newVersion,
        },
      },
    });

    if (!oldContract || !newContract) {
      throw new Error('Contract versions not found');
    }

    const oldSchema = oldContract.schemaDefinition as unknown as ContractSchema;
    const newSchema = newContract.schemaDefinition as unknown as ContractSchema;

    const breakingChanges: BreakingChange[] = [];

    // Detect field removals
    const oldFields = Object.keys(oldSchema.properties || {});
    const newFields = Object.keys(newSchema.properties || {});
    
    for (const field of oldFields) {
      if (!newFields.includes(field)) {
        const fieldValue = oldSchema.properties?.[field];
        breakingChanges.push({
          type: 'field_removed',
          field,
          before: fieldValue,
          after: null,
          severity: 'critical',
        });
      }
    }

    // Detect type changes
    for (const field of newFields) {
      if (oldFields.includes(field)) {
        const oldField = oldSchema.properties?.[field] as { type?: string } | undefined;
        const newField = newSchema.properties?.[field] as { type?: string } | undefined;
        const oldType = oldField?.type;
        const newType = newField?.type;
        
        if (oldType !== newType) {
          breakingChanges.push({
            type: 'field_type_changed',
            field,
            before: oldType,
            after: newType,
            severity: 'high',
          });
        }
      }
    }

    // Detect new required fields
    const oldRequired = oldSchema.required || [];
    const newRequired = newSchema.required || [];
    
    for (const field of newRequired) {
      if (!oldRequired.includes(field)) {
        breakingChanges.push({
          type: 'required_added',
          field,
          before: { required: false },
          after: { required: true },
          severity: 'high',
        });
      }
    }

    // Update contract with breaking changes
    await this.prisma.contractVersion.update({
      where: { id: newContract.id },
      data: {
        breakingChanges: breakingChanges as unknown as Prisma.InputJsonValue,
      },
    });

    return breakingChanges;
  }

  /**
   * Generate migration guide for breaking changes
   */
  async generateMigrationGuide(
    tenantId: string,
    contractName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string> {
    const breakingChanges = await this.detectBreakingChanges(
      tenantId,
      contractName,
      fromVersion,
      toVersion
    );

    let guide = `# Migration Guide: ${contractName} ${fromVersion} → ${toVersion}\n\n`;
    guide += `## Breaking Changes\n\n`;

    for (const change of breakingChanges) {
      guide += `### ${change.field} (${change.severity})\n\n`;
      guide += `**Type:** ${change.type}\n\n`;
      guide += `**Before:** ${JSON.stringify(change.before, null, 2)}\n\n`;
      guide += `**After:** ${JSON.stringify(change.after, null, 2)}\n\n`;
      guide += `**Mitigation:** TODO\n\n`;
    }

    // Update contract with migration guide
    await this.prisma.contractVersion.updateMany({
      where: {
        tenantId,
        contractName,
        version: toVersion,
      },
      data: {
        migrationGuide: guide,
      },
    });

    return guide;
  }
}
