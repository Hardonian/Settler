export declare const EXPORT_SCHEMA_VERSION: "1.0.0";
export declare function stableStringify(value: unknown): string;
export declare function computeReconciliationHash(run: unknown, matches: unknown[]): string;
export declare function computeChainHash(previousHash: string | null, reconciliationHash: string): string;
export declare function validateHashChain(chain: Array<{
    previousHash: string | null;
    reconciliationHash: string;
    chainHash: string;
}>): {
    valid: boolean;
    brokenIndex: number | null;
};
//# sourceMappingURL=export-integrity.d.ts.map