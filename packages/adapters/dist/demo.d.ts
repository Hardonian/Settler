/**
 * Demo Adapter
 *
 * Stub adapter that returns deterministic demo data
 * without making external API calls.
 *
 * Used when DEMO_MODE=true to enable self-contained demonstrations.
 */
import { Adapter, NormalizedData, FetchOptions } from "./base";
export declare class DemoStripeAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): {
        valid: boolean;
        errors?: string[];
    };
}
export declare class DemoBankAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): {
        valid: boolean;
        errors?: string[];
    };
}
export declare function isDemoMode(): boolean;
export declare function getDemoAdapter(type: "stripe" | "bank"): Adapter;
export declare function getAvailableAdapters(): Adapter[];
//# sourceMappingURL=demo.d.ts.map