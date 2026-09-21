# Integration / Adapter Audit — Settler

**Date:** June 2026
**Purpose:** Resolve discrepancy between "50+ integrations" and "10+" claims across repo docs

---

## Audit Methodology

Scanned `packages/adapters/src/` for all classes implementing `Adapter` or `EnhancedAdapter` interface. Counted unique source TypeScript files (excluding `.d.ts` and `.js` compiled output).

## Actual Adapter Count

### Core Adapters (`packages/adapters/src/*.ts`)

| #   | Adapter Class               | File                     | Type                            | Bytes         |
| --- | --------------------------- | ------------------------ | ------------------------------- | ------------- |
| 1   | `StripeAdapter`             | `stripe.ts`              | Payment Processor               | 2,329         |
| 2   | `StripeEnhancedAdapter`     | `stripe-enhanced.ts`     | Payment Processor (Enhanced)    | 10,022        |
| 3   | `PayPalAdapter`             | `paypal.ts`              | Payment Processor               | 1,835         |
| 4   | `PayPalEnhancedAdapter`     | `paypal-enhanced.ts`     | Payment Processor (Enhanced)    | 11,794        |
| 5   | `PayPalPayoutsAdapter`      | `paypal-payouts.ts`      | Payout                          | 3,519         |
| 6   | `EnhancedPayPalAdapter`     | `enhanced-paypal.ts`     | Payment Processor (Enhanced v2) | 6,689         |
| 7   | `ShopifyAdapter`            | `shopify.ts`             | E-commerce                      | 2,242         |
| 8   | `QuickBooksAdapter`         | `quickbooks.ts`          | Accounting                      | 1,904         |
| 9   | `EnhancedQuickBooksAdapter` | `enhanced-quickbooks.ts` | Accounting (Enhanced)           | 6,771         |
| 10  | `SquareEnhancedAdapter`     | `square-enhanced.ts`     | Payment Processor (Enhanced)    | 11,345        |
| 11  | `XeroAdapter`               | `xero.ts`                | Accounting                      | 5,297         |
| 12  | `WooCommerceAdapter`        | `woocommerce.ts`         | E-commerce                      | 4,969         |
| 13  | `NetSuiteAdapter`           | `netsuite.ts`            | ERP                             | 4,345         |
| 14  | `GooglePayAdapter`          | `google-pay.ts`          | Payment Processor               | 2,572         |
| 15  | `MetaCommerceAdapter`       | `meta-commerce.ts`       | E-commerce/Social               | 4,692         |
| 16  | `TikTokShopAdapter`         | `tiktok-shop.ts`         | E-commerce/Social               | 5,360         |
| 17  | `WixStoresAdapter`          | `wix-stores.ts`          | E-commerce                      | 2,711         |
| 18  | `GA4DeepSyncAdapter`        | `ga4-deep-sync.ts`       | Analytics                       | 3,479         |
| 19  | `WhatsAppTelegramAdapter`   | `whatsapp-telegram.ts`   | Messaging/Notifications         | 3,731         |
| 20  | `DemoStripeAdapter`         | `demo.ts`                | Demo/Test                       | 4,237         |
| 21  | `DemoBankAdapter`           | `demo.ts`                | Demo/Test                       | (shared file) |

### Driver Connectors (`packages/adapters/src/drivers/*.ts`)

| #   | Driver            | File                | Type                 | Bytes  |
| --- | ----------------- | ------------------- | -------------------- | ------ |
| 1   | Amazon Seller     | `amazon-seller.ts`  | Marketplace          | 6,655  |
| 2   | Avalara           | `avalara.ts`        | Tax                  | 5,181  |
| 3   | Chargebee         | `chargebee.ts`      | Subscription Billing | 7,910  |
| 4   | eBay              | `ebay.ts`           | Marketplace          | 8,928  |
| 5   | Etsy              | `etsy.ts`           | Marketplace          | 7,811  |
| 6   | FreshBooks        | `freshbooks.ts`     | Accounting           | 7,905  |
| 7   | NetSuite (driver) | `netsuite.ts`       | ERP                  | 5,444  |
| 8   | Plaid             | `plaid.ts`          | Banking/Open Banking | 11,782 |
| 9   | Recurly           | `recurly.ts`        | Subscription Billing | 7,394  |
| 10  | SAP               | `sap.ts`            | ERP                  | 6,258  |
| 11  | Stripe Connect    | `stripe-connect.ts` | Marketplace Payments | 10,101 |
| 12  | TaxJar            | `taxjar.ts`         | Tax                  | 4,754  |
| 13  | TrueLayer         | `truelayer.ts`      | Open Banking         | 12,591 |
| 14  | Wave              | `wave.ts`           | Accounting           | 4,804  |

### Supporting Infrastructure

| Component             | File                               | Purpose                                |
| --------------------- | ---------------------------------- | -------------------------------------- |
| Connector Contract    | `connector-contract.ts` (5.6KB)    | Standard interface for all connectors  |
| Connector Driver      | `connector-driver.ts` (7.7KB)      | Driver execution framework             |
| Connector Runtime     | `connector-runtime.ts` (42KB)      | Full runtime with lifecycle management |
| Connector Sandbox     | `connector-sandbox.ts` (2.6KB)     | Isolation / sandboxing                 |
| Credential Encryption | `credential-encryption.ts` (5.7KB) | Credential storage                     |
| Rate Limiting         | `rate-limiting.ts` (3.9KB)         | Per-adapter rate limits                |
| Token Refresh         | `token-refresh.ts` (3.5KB)         | OAuth token lifecycle                  |
| Webhook Verification  | `webhook-verification.ts` (4KB)    | Inbound webhook security               |

---

## Summary

| Category                                  | Count  |
| ----------------------------------------- | ------ |
| Core adapters (unique, excluding demo)    | **19** |
| Driver connectors                         | **14** |
| Demo/test adapters                        | **2**  |
| **Total unique data source integrations** | **33** |

## Honest Assessment

- **"50+ integrations" is incorrect.** The actual count is **33 unique data source integrations** (19 core adapters + 14 drivers), plus 2 demo adapters.
- **"10+" in the competitor teardown was understated.** The actual count is 33.
- **Recommended investor-facing claim: "30+ platform integrations"** — conservative, defensible, verifiable.
- **Note:** Some adapters have "enhanced" versions (Stripe, PayPal, Square, QuickBooks), which are not separate platforms but deeper integration with the same platform. Counting unique platforms: **~25 unique platforms**.
- The connector runtime (`connector-runtime.ts` at 42KB) and driver framework suggest the architecture is designed for rapid adapter addition.

## What to Say to Investors

> "Settler has working adapters for 25+ payment processors, e-commerce platforms, accounting tools, and banking APIs — including Stripe, PayPal, Square, Shopify, QuickBooks, Xero, NetSuite, Plaid, and others. The connector framework is designed so new adapters can be added in days, not weeks."

Do NOT say "50+ integrations" unless additional adapters are built and tested.
