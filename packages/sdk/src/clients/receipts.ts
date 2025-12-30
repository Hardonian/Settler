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

export class ReceiptsClient {
  constructor(private client: SettlerClient) {}

  async parse(file: string, options?: { forceOcr?: boolean }): Promise<Receipt> {
    const body: { url?: string; content?: string; options?: { forceOcr?: boolean } } = {};
    if (file.startsWith("http")) {
      body.url = file;
    } else {
      body.content = file;
    }

    if (options) {
      body.options = options;
    }

    return this.client.request<Receipt>("POST", "/v1/receipts/parse", { body });
  }

  async get(id: string): Promise<Receipt> {
    return this.client.request<Receipt>("GET", `/v1/receipts/${id}`);
  }
}
