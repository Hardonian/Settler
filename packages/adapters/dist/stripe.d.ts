import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export declare class StripeAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=stripe.d.ts.map