/**
 * Receipt Domain Types
 *
 * Type definitions for receipt parsing and normalization.
 */

export interface NormalizedReceipt {
  vendor: string | null;
  date: Date | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  paymentMethod: string | null;
  items: NormalizedReceiptItem[];
}

export interface NormalizedReceiptItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
  category: string | null;
}

export interface OcrResult {
  text: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface ReceiptParseResult {
  receipt: NormalizedReceipt;
  confidenceScore: number;
  rawText: string;
}
