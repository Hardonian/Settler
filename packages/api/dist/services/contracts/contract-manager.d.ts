/**
 * Data Contract Manager
 *
 * Manages data contract versioning and breaking change detection
 * Part of Phase V: AIOS
 */
import { PrismaClient, Prisma } from '@prisma/client';
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
export declare class ContractManager {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create new contract version
     */
    createContractVersion(tenantId: string, contractName: string, version: string, schema: ContractSchema): Promise<{
        id: string;
        version: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        tenantId: string;
        isActive: boolean;
        contractName: string;
        schemaDefinition: Prisma.JsonValue;
        isDeprecated: boolean;
        deprecatedAt: Date | null;
        breakingChanges: Prisma.JsonValue;
        migrationGuide: string | null;
    }>;
    /**
     * Compare contract versions and detect breaking changes
     */
    detectBreakingChanges(tenantId: string, contractName: string, oldVersion: string, newVersion: string): Promise<BreakingChange[]>;
    /**
     * Generate migration guide for breaking changes
     */
    generateMigrationGuide(tenantId: string, contractName: string, fromVersion: string, toVersion: string): Promise<string>;
}
//# sourceMappingURL=contract-manager.d.ts.map