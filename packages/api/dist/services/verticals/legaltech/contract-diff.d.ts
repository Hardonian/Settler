/**
 * LegalTech Module - Contract Diff Service
 *
 * Part of Phase IV: Vertical Modules
 */
import { PrismaClient } from '@prisma/client';
export interface ContractDiff {
    added: string[];
    removed: string[];
    modified: Array<{
        clause: string;
        before: string;
        after: string;
    }>;
    riskScore: number;
}
interface Obligation {
    party: string;
    obligation: string;
    deadline?: string;
    penalty?: string;
    [key: string]: unknown;
}
export declare class ContractDiffService {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Compare two contract versions
     */
    diffContracts(tenantId: string, _contract1: string, _contract2: string): Promise<ContractDiff>;
    /**
     * Extract obligations from contract
     */
    extractObligations(_contract: string): Promise<Array<{
        party: string;
        obligation: string;
        deadline?: string;
        penalty?: string;
    }>>;
    /**
     * Map obligations between contracts
     */
    mapObligations(_sourceObligations: unknown[], _targetObligations: unknown[]): Promise<Array<{
        source: Obligation;
        target: Obligation;
        confidence: number;
    }>>;
}
export {};
//# sourceMappingURL=contract-diff.d.ts.map