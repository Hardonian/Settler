import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export declare class QuickBooksAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=quickbooks.d.ts.map