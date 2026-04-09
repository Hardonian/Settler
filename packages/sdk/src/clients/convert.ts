import { SettlerClient } from "../client";

export class ConvertClient {
  constructor(private client: SettlerClient) {}

  async unit(value: number, from: string, to: string): Promise<{ value: number; unit: string }> {
    return this.client.request("POST", "/v1/convert/unit", {
      body: { value, from, to },
    });
  }

  async currency(
    amount: number,
    from: string,
    to: string,
    date?: string
  ): Promise<{ amount: number; currency: string; rate: number }> {
    return this.client.request("POST", "/v1/convert/currency", {
      body: { amount, from, to, date },
    });
  }

  async financial(amount: number, fromFormat: string, toFormat: string): Promise<string> {
    return this.client.request("POST", "/v1/convert/financial", {
      body: { amount, fromFormat, toFormat },
    });
  }
}
