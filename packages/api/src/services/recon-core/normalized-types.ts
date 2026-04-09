export enum RecordType {
  CHARGE = "CHARGE",
  REFUND = "REFUND",
  PAYOUT = "PAYOUT",
  FEE = "FEE",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum RecordDirection {
  INCOMING = "INCOMING", // Money entering the account
  OUTGOING = "OUTGOING", // Money leaving the account
}

export interface NormalizedRecord {
  id: string; // Internal UUID
  externalId: string; // ID from source (ch_123, order_456)
  source: string; // 'Stripe', 'Shopify', 'Bank', 'QuickBooks'
  occurredAt: Date; // ISO Date
  amount: number; // Absolute value in major units (10.00)
  currency: string; // ISO 4217 (USD, EUR)
  direction: RecordDirection;
  type: RecordType;
  status: string; // 'succeeded', 'pending', 'failed'

  // Metadata for matching
  description?: string;
  customerEmail?: string;
  customerName?: string;
  orderId?: string; // Common key for e-commerce
  payoutId?: string; // For grouping batch settlements
  feeAmount?: number; // Processing fees associated with this record
  netAmount?: number; // Amount - Fee (if applicable)

  // Raw data for audit
  raw: Record<string, unknown>;
}
