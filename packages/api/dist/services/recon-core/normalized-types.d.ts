export declare enum RecordType {
    CHARGE = "CHARGE",
    REFUND = "REFUND",
    PAYOUT = "PAYOUT",
    FEE = "FEE",
    TRANSFER = "TRANSFER",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare enum RecordDirection {
    INCOMING = "INCOMING",// Money entering the account
    OUTGOING = "OUTGOING"
}
export interface NormalizedRecord {
    id: string;
    externalId: string;
    source: string;
    occurredAt: Date;
    amount: number;
    currency: string;
    direction: RecordDirection;
    type: RecordType;
    status: string;
    description?: string;
    customerEmail?: string;
    customerName?: string;
    orderId?: string;
    payoutId?: string;
    feeAmount?: number;
    netAmount?: number;
    raw: Record<string, unknown>;
}
//# sourceMappingURL=normalized-types.d.ts.map