import React from 'react';
import type { ReconciliationTransaction, ReconciliationException } from '@settler/protocol';
export interface ShopifyAppProps {
    shop: string;
    apiKey: string;
    transactions?: ReconciliationTransaction[];
    exceptions?: ReconciliationException[];
    onAction?: (action: string, data: unknown) => void;
}
/**
 * Shopify App Wrapper
 * Optimized for Shopify Polaris design system
 */
export declare function ShopifyApp({ shop, transactions, exceptions, onAction }: ShopifyAppProps): import("react/jsx-runtime").JSX.Element;
/**
 * Shopify App Bridge Integration
 * For use with Shopify App Bridge
 */
export declare function useShopifyAppBridge(): {
    shop: string;
    apiKey: string;
    setApiKey: React.Dispatch<React.SetStateAction<string>>;
};
//# sourceMappingURL=shopify.d.ts.map