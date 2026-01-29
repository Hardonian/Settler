import { SettlerClient } from "../client";
export interface ReceiptLineItem {
    description: string;
    amount: number;
    quantity?: number;
    unitPrice?: number;
}
export interface Receipt {
    id: string;
    merchant: {
        name: string;
        address?: string;
        taxId?: string;
    };
    date: string;
    total: number;
    currency: string;
    tax?: number;
    items: ReceiptLineItem[];
    metadata: Record<string, unknown>;
}
export declare class ReceiptsClient {
    private client;
    constructor(client: SettlerClient);
    parse(file: string, options?: {
        forceOcr?: boolean;
    }): Promise<Receipt>;
    get(id: string): Promise<Receipt>;
}
//# sourceMappingURL=receipts.d.ts.map