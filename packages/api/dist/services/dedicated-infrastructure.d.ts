/**
 * Dedicated Infrastructure Service
 * Handles dedicated infrastructure provisioning and management
 */
export interface DedicatedInfrastructure {
    id: string;
    tenantId: string;
    infrastructureType: string;
    resourceConfig: {
        compute?: {
            cpu: number;
            memory: number;
            storage: number;
        };
        database?: {
            instanceType: string;
            storage: number;
            backupRetention: number;
        };
        network?: {
            isolationLevel: string;
            vpcId?: string;
        };
    };
    isolationLevel: "standard" | "enhanced" | "dedicated";
    dataRetentionDays?: number;
    securityConfig: {
        encryptionAtRest: boolean;
        encryptionInTransit: boolean;
        ipWhitelist?: string[];
        mfaRequired: boolean;
    };
    isActive: boolean;
}
/**
 * Provision dedicated infrastructure
 */
export declare function provisionDedicatedInfrastructure(tenantId: string, infrastructureType: string, resourceConfig: DedicatedInfrastructure["resourceConfig"], options?: {
    isolationLevel?: "standard" | "enhanced" | "dedicated";
    dataRetentionDays?: number;
    securityConfig?: Partial<DedicatedInfrastructure["securityConfig"]>;
}): Promise<string>;
/**
 * Get dedicated infrastructure
 */
export declare function getDedicatedInfrastructure(tenantId: string, infrastructureId: string): Promise<DedicatedInfrastructure | null>;
/**
 * List dedicated infrastructure
 */
export declare function listDedicatedInfrastructure(tenantId: string, filters?: {
    isActive?: boolean;
    infrastructureType?: string;
}): Promise<DedicatedInfrastructure[]>;
/**
 * Deprovision dedicated infrastructure
 */
export declare function deprovisionDedicatedInfrastructure(tenantId: string, infrastructureId: string): Promise<void>;
//# sourceMappingURL=dedicated-infrastructure.d.ts.map