import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
export declare class PayPalAdapter implements Adapter {
  name: string;
  version: string;
  fetch(options: FetchOptions): Promise<NormalizedData[]>;
  normalize(data: unknown): NormalizedData;
  validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=paypal.d.ts.map
