🎯 **What:**
Added a test suite for `packages/adapters/src/webhook-verification.ts` to ensure webhook signature verification for providers like Stripe, Plaid, Chargebee, and Recurly behaves as expected.

📊 **Coverage:**
- `verifyStripeWebhook`: covers valid signatures, fallback scenarios where multiple `v1` signatures exist and only one matches, invalid formats (missing timestamp or missing signature array), and invalid HMACS.
- Covers the basic valid/invalid HMAC signatures of the other webhook verification functions present in the file: `verifyPlaidWebhook`, `verifyChargebeeWebhook`, `verifyRecurlyWebhook`.
- Covers `verifyWebhook` general routing for providers as well as the fallback path for unsupported providers.

✨ **Result:**
Increased testing coverage and guarantees around security validation logic for incoming webhooks for various providers.
