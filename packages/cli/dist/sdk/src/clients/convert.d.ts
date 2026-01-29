import { SettlerClient } from "../client";
export declare class ConvertClient {
    private client;
    constructor(client: SettlerClient);
    unit(value: number, from: string, to: string): Promise<{
        value: number;
        unit: string;
    }>;
    currency(amount: number, from: string, to: string, date?: string): Promise<{
        amount: number;
        currency: string;
        rate: number;
    }>;
    financial(amount: number, fromFormat: string, toFormat: string): Promise<string>;
}
//# sourceMappingURL=convert.d.ts.map