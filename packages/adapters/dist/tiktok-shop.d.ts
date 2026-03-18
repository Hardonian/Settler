import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * TikTok Shop + TikTok Ads Adapter
 * Fetches order data from TikTok Shop and ad spend from TikTok Ads
 */
export declare class TikTokShopAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalizeShopOrder(data: unknown): NormalizedData;
    normalizeAdsSpend(data: unknown): NormalizedData;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=tiktok-shop.d.ts.map